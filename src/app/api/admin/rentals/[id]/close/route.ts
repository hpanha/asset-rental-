import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const {
      closedBy = 'Admin Finance Operations',
      notes,
      unitDisposition,
      maintenanceReason,
      maintenanceStartAt,
      maintenanceEndAt,
    } = body

    const reservation = await db.rentalReservation.findFirst({
      where: {
        OR: [{ id }, { bookingNo: id }, { requestId: id }],
      },
      include: {
        request: {
          include: { paymentOrder: true, depositLedger: true, quoteSnapshot: true },
        },
        lines: {
          include: {
            unitAllocations: {
              include: { unit: true },
            },
          },
        },
        inspection: {
          include: { items: true },
        },
        settlement: true,
        closure: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Idempotency: if already closed, return existing closure (CL06)
    if (reservation.status === 'COMPLETED' && reservation.closure) {
      return NextResponse.json({
        is_duplicate: true,
        success: true,
        status: 'COMPLETED',
        closedAt: reservation.closure.closedAt,
        message: 'Rental was already closed and completed.',
      })
    }

    const allowableStatuses = ['SETTLED', 'ACTIVE', 'RETURNED', 'READY_FOR_HANDOVER', 'RESERVED']
    if (!allowableStatuses.includes(reservation.status)) {
      return NextResponse.json(
        { error: `Cannot close rental in status "${reservation.status}". Must be reserved, ready for handover, active, returned, or settled.` },
        { status: 400 }
      )
    }

    const now = new Date()

    const result = await db.$transaction(async (tx) => {
      // 1. Release allocations and update physical unit dispositions
      const allocations = reservation.lines[0]?.unitAllocations || []
      const inspectionItems = reservation.inspection?.items || []

      for (const alloc of allocations) {
        // Mark allocation released
        await tx.rentalUnitAllocation.update({
          where: { id: alloc.id },
          data: {
            status: 'RELEASED',
          },
        })

        // Determine unit disposition
        const item = inspectionItems.find((i) => i.unitId === alloc.unitId)
        const targetStatus = unitDisposition || item?.disposition || 'AVAILABLE'

        if (targetStatus === 'MAINTENANCE') {
          await tx.assetUnit.update({
            where: { id: alloc.unitId },
            data: { baseStatus: 'MAINTENANCE' },
          })

          const startDate = maintenanceStartAt ? new Date(maintenanceStartAt) : now
          const endDate = maintenanceEndAt
            ? new Date(maintenanceEndAt)
            : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

          await tx.assetBlockedInterval.create({
            data: {
              listingId: reservation.lines[0]?.listingId || alloc.unit?.listingId || reservation.request?.listingId,
              unitId: alloc.unitId,
              startAt: startDate,
              endAt: endDate,
              reason: maintenanceReason || 'Post-rental maintenance & servicing',
              notes: notes || 'Unit moved to maintenance upon rental closure',
              createdBy: closedBy,
            },
          })
        } else if (targetStatus === 'LOST') {
          await tx.assetUnit.update({
            where: { id: alloc.unitId },
            data: { baseStatus: 'LOST' },
          })
        } else {
          // Healthy: remains active and available for future bookings
          await tx.assetUnit.update({
            where: { id: alloc.unitId },
            data: { baseStatus: 'ACTIVE' },
          })
        }
      }

      // 2. Create Closure Summary Snapshot
      const closureSummary = {
        bookingNo: reservation.bookingNo,
        requestNo: reservation.request.requestNo,
        renterName: reservation.request.contactName,
        totalRentalPaid: reservation.settlement?.rentalAmount || reservation.request.quoteSnapshot?.totalPayable || 0,
        depositReturned: reservation.settlement?.netRefundAmount || reservation.request.depositLedger?.heldAmount || 0,
        deductionsRetained: reservation.settlement?.totalDeductions || 0,
        inspectionVerdict: reservation.inspection?.verdict || (unitDisposition === 'MAINTENANCE' ? 'MAINTENANCE_REQUIRED' : 'PASS'),
        allocatedUnits: allocations.map((a) => a.unit.assetTag),
        disposition: unitDisposition || 'AVAILABLE',
      }

      const closure = await tx.rentalClosure.create({
        data: {
          reservationId: reservation.id,
          closedAt: now,
          closedBy,
          closureType: 'NORMAL',
          finalStatus: 'COMPLETED',
          summaryJson: JSON.stringify(closureSummary),
          notes,
        },
      })

      // 3. Update Reservation to COMPLETED
      await tx.rentalReservation.update({
        where: { id: reservation.id },
        data: {
          status: 'COMPLETED',
          version: reservation.version + 1,
        },
      })

      // 4. Update Request to COMPLETED
      await tx.rentalRequest.update({
        where: { id: reservation.requestId },
        data: {
          status: 'COMPLETED',
        },
      })

      // 5. Audit Event
      await tx.rentalReservationEvent.create({
        data: {
          reservationId: reservation.id,
          actorName: closedBy,
          actorRole: 'ADMIN',
          action: 'CLOSE_RENTAL',
          fromStatus: reservation.status,
          toStatus: 'COMPLETED',
          notes: `Rental closed. Inventory released to catalog. Closed by ${closedBy}.`,
        },
      })

      return closure
    })

    return NextResponse.json({
      success: true,
      status: 'COMPLETED',
      closureId: result.id,
      closedAt: result.closedAt,
      message: 'Rental successfully completed and closed. Inventory status updated.',
    })
  } catch (error: any) {
    console.error('Error closing rental:', error)
    return NextResponse.json({ error: error.message || 'Failed to close rental' }, { status: 500 })
  }
}
