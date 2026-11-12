-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "passwordHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'client',
    "adminRole" TEXT DEFAULT 'STAFF',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalCompany" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'RentHub Enterprise Rentals',
    "legalName" TEXT DEFAULT 'RentHub Co., Ltd.',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh',
    "phone" TEXT DEFAULT '+855 23 888 999',
    "email" TEXT DEFAULT 'support@renthub.app',
    "address" TEXT DEFAULT 'Building 42, Norodom Blvd, Phnom Penh, Cambodia',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "iconName" TEXT DEFAULT 'Folder',
    "color" TEXT DEFAULT '#10B981',
    "parentId" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLocation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Phnom_Penh',
    "isPickupDefault" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetListing" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "model" TEXT,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "specifications" TEXT,
    "trackingMode" TEXT NOT NULL DEFAULT 'SERIALIZED',
    "conditionNote" TEXT,
    "coverImage" TEXT NOT NULL,
    "images" TEXT NOT NULL DEFAULT '[]',
    "allowDelivery" BOOLEAN NOT NULL DEFAULT true,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visibility" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLocationOption" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "pickupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "returnEnabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssetLocationOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetUnit" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "assetTag" TEXT NOT NULL,
    "serialNumber" TEXT,
    "locationId" TEXT NOT NULL,
    "baseStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "conditionGrade" TEXT NOT NULL DEFAULT 'GOOD',
    "accessories" TEXT,
    "conditionPhotos" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRate" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingUnit" TEXT NOT NULL DEFAULT 'DAY',
    "rateAmount" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AssetRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetRentalPolicy" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumDuration" INTEGER NOT NULL DEFAULT 1,
    "minimumDurationUnit" TEXT NOT NULL DEFAULT 'DAY',
    "maximumDuration" INTEGER,
    "lateFeeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateFeeUnit" TEXT NOT NULL DEFAULT 'DAY',
    "lateGraceMinutes" INTEGER NOT NULL DEFAULT 30,
    "minAdvanceNoticeMinutes" INTEGER NOT NULL DEFAULT 120,
    "preparationBufferMinutes" INTEGER NOT NULL DEFAULT 120,
    "returnBufferMinutes" INTEGER NOT NULL DEFAULT 120,
    "allowedPickupWeekdays" TEXT DEFAULT '["MON","TUE","WED","THU","FRI","SAT","SUN"]',
    "termsTemplate" TEXT,

    CONSTRAINT "AssetRentalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetBlockedInterval" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "unitId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetBlockedInterval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetAuditEvent" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "listingId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL DEFAULT 'Admin',
    "action" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "unitId" TEXT,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalRequest" (
    "id" TEXT NOT NULL,
    "requestNo" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "rentalDays" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "fulfillment" TEXT NOT NULL DEFAULT 'PICKUP',
    "pickupLocationId" TEXT,
    "returnLocationId" TEXT,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "organizationName" TEXT,
    "customerNotes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "paymentDueAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "quoteToken" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalQuoteSnapshot" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingUnit" TEXT NOT NULL DEFAULT 'DAY',
    "unitRate" DOUBLE PRECISION NOT NULL,
    "rentalDays" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rentalSubtotal" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayable" DOUBLE PRECISION NOT NULL,
    "contingentLateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contingentLateFeeUnit" TEXT NOT NULL DEFAULT 'DAY',
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalQuoteSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalRequestAddress" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT,
    "deliveryNotes" TEXT,

    CONSTRAINT "RentalRequestAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalTermsAcceptance" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "termsVersionId" TEXT NOT NULL DEFAULT 'rental-terms-2026.1',
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT NOT NULL,
    "ipAddress" TEXT,

    CONSTRAINT "RentalTermsAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalRequestEvent" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorType" TEXT NOT NULL DEFAULT 'RENTER',
    "action" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalRequestEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalApprovalDecision" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL DEFAULT 'Admin',
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT,
    "publicReason" TEXT,
    "internalNotes" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestVersion" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "RentalApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalInventoryHold" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT NOT NULL DEFAULT 'Admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalInventoryHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalHoldUnit" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "RentalHoldUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalChangeProposal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "proposedStartAt" TIMESTAMP(3),
    "proposedEndAt" TIMESTAMP(3),
    "proposedQuantity" INTEGER,
    "proposedRate" DOUBLE PRECISION,
    "proposedSubtotal" DOUBLE PRECISION,
    "proposedDeposit" DOUBLE PRECISION,
    "proposedTotal" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_RENTER_RESPONSE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalChangeProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPaymentOrder" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rentalAmount" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDue" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "method" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SYSTEM_GATEWAY',
    "providerReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "idempotencyKey" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPaymentReceipt" (
    "id" TEXT NOT NULL,
    "paymentOrderId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "rentalAmount" DOUBLE PRECISION NOT NULL,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCaptured" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalPaymentReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalDepositLedger" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "collectedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heldAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liabilityBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'HELD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalDepositLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReservation" (
    "id" TEXT NOT NULL,
    "bookingNo" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,
    "fulfillmentMode" TEXT NOT NULL DEFAULT 'PICKUP',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReservationLine" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "rateSnapshotId" TEXT,
    "fulfillmentMode" TEXT NOT NULL DEFAULT 'PICKUP',

    CONSTRAINT "RentalReservationLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalUnitAllocation" (
    "id" TEXT NOT NULL,
    "reservationLineId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMMITTED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalUnitAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalPoolAllocation" (
    "id" TEXT NOT NULL,
    "reservationLineId" TEXT NOT NULL,
    "stockPoolId" TEXT NOT NULL DEFAULT 'DEFAULT_POOL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPoolAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalFulfillmentTask" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "pickupAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT,
    "assignedStaffId" TEXT DEFAULT 'staff-01',
    "assignedStaffName" TEXT DEFAULT 'Warehouse Operations',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "checklistJson" TEXT,
    "notes" TEXT,
    "preparedAt" TIMESTAMP(3),
    "handedOverAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalFulfillmentTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReservationEvent" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL DEFAULT 'SYSTEM',
    "actorName" TEXT NOT NULL DEFAULT 'Reservation System',
    "actorRole" TEXT NOT NULL DEFAULT 'SYSTEM',
    "action" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalReservationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalHandover" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "locationId" TEXT,
    "handoverAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT DEFAULT 'staff-01',
    "staffName" TEXT NOT NULL DEFAULT 'Warehouse Operations',
    "receiverName" TEXT NOT NULL,
    "signature" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalHandover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalHandoverItem" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "scannedTag" TEXT NOT NULL,
    "conditionGrade" TEXT NOT NULL DEFAULT 'GOOD',
    "functionalCheck" TEXT NOT NULL DEFAULT 'PASS',
    "notes" TEXT,
    "accepted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RentalHandoverItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalHandoverAccessory" (
    "id" TEXT NOT NULL,
    "handoverItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedQty" INTEGER NOT NULL DEFAULT 1,
    "actualQty" INTEGER NOT NULL DEFAULT 1,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,

    CONSTRAINT "RentalHandoverAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalEvidence" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "notes" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL DEFAULT 'Staff',

    CONSTRAINT "RentalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalExtensionRequest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "requestedEndAt" TIMESTAMP(3) NOT NULL,
    "additionalDays" INTEGER NOT NULL,
    "additionalCharge" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decidedBy" TEXT,

    CONSTRAINT "RentalExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalIncident" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "RentalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReturnCase" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "returnLocationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "actualReceivedAt" TIMESTAMP(3),
    "receivingStaffName" TEXT,
    "discrepancyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalReturnCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalReturnReceipt" (
    "id" TEXT NOT NULL,
    "returnCaseId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivingStaffName" TEXT NOT NULL DEFAULT 'Warehouse Receiving',
    "locationName" TEXT NOT NULL DEFAULT 'Main Logistics Facility',
    "totalUnitsReceived" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "RentalReturnReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalInspection" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "inspectorName" TEXT NOT NULL DEFAULT 'Technical Quality Inspector',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "verdict" TEXT NOT NULL DEFAULT 'PASS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalInspectionItem" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "conditionGrade" TEXT NOT NULL DEFAULT 'GOOD',
    "functionalResult" TEXT NOT NULL DEFAULT 'PASS',
    "verdict" TEXT NOT NULL DEFAULT 'PASS',
    "disposition" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "damageNotes" TEXT,
    "estimatedRepairCost" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "RentalInspectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalSettlement" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "rentalAmount" DOUBLE PRECISION NOT NULL,
    "depositHeld" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lateFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "damageFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "missingItemsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cleaningFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRefundAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalDueAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalClosure" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedBy" TEXT NOT NULL DEFAULT 'System / Admin Finance',
    "closureType" TEXT NOT NULL DEFAULT 'NORMAL',
    "finalStatus" TEXT NOT NULL DEFAULT 'COMPLETED',
    "summaryJson" TEXT,
    "notes" TEXT,

    CONSTRAINT "RentalClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalMaintenanceTask" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "reservationId" TEXT,
    "issueDescription" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "RentalMaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AssetCategory_slug_key" ON "AssetCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AssetBrand_name_key" ON "AssetBrand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AssetBrand_slug_key" ON "AssetBrand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AssetLocation_code_key" ON "AssetLocation"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetListing_code_key" ON "AssetListing"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AssetListing_slug_key" ON "AssetListing"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AssetLocationOption_listingId_locationId_key" ON "AssetLocationOption"("listingId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssetUnit_assetTag_key" ON "AssetUnit"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "AssetRentalPolicy_listingId_key" ON "AssetRentalPolicy"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalRequest_requestNo_key" ON "RentalRequest"("requestNo");

-- CreateIndex
CREATE INDEX "RentalRequest_renterId_status_idx" ON "RentalRequest"("renterId", "status");

-- CreateIndex
CREATE INDEX "RentalRequest_companyId_status_idx" ON "RentalRequest"("companyId", "status");

-- CreateIndex
CREATE INDEX "RentalRequest_requestNo_idx" ON "RentalRequest"("requestNo");

-- CreateIndex
CREATE UNIQUE INDEX "RentalQuoteSnapshot_requestId_key" ON "RentalQuoteSnapshot"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalRequestAddress_requestId_key" ON "RentalRequestAddress"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalTermsAcceptance_requestId_key" ON "RentalTermsAcceptance"("requestId");

-- CreateIndex
CREATE INDEX "RentalRequestEvent_requestId_idx" ON "RentalRequestEvent"("requestId");

-- CreateIndex
CREATE INDEX "RentalApprovalDecision_requestId_idx" ON "RentalApprovalDecision"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalInventoryHold_requestId_key" ON "RentalInventoryHold"("requestId");

-- CreateIndex
CREATE INDEX "RentalInventoryHold_listingId_status_idx" ON "RentalInventoryHold"("listingId", "status");

-- CreateIndex
CREATE INDEX "RentalInventoryHold_expiresAt_status_idx" ON "RentalInventoryHold"("expiresAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RentalHoldUnit_holdId_unitId_key" ON "RentalHoldUnit"("holdId", "unitId");

-- CreateIndex
CREATE INDEX "RentalChangeProposal_requestId_idx" ON "RentalChangeProposal"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPaymentOrder_requestId_key" ON "RentalPaymentOrder"("requestId");

-- CreateIndex
CREATE INDEX "RentalPaymentOrder_paymentStatus_idx" ON "RentalPaymentOrder"("paymentStatus");

-- CreateIndex
CREATE INDEX "RentalPaymentAttempt_paymentOrderId_idx" ON "RentalPaymentAttempt"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPaymentReceipt_paymentOrderId_key" ON "RentalPaymentReceipt"("paymentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalPaymentReceipt_receiptNo_key" ON "RentalPaymentReceipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "RentalDepositLedger_requestId_key" ON "RentalDepositLedger"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalReservation_bookingNo_key" ON "RentalReservation"("bookingNo");

-- CreateIndex
CREATE UNIQUE INDEX "RentalReservation_requestId_key" ON "RentalReservation"("requestId");

-- CreateIndex
CREATE INDEX "RentalReservation_renterId_status_idx" ON "RentalReservation"("renterId", "status");

-- CreateIndex
CREATE INDEX "RentalReservation_status_startAt_idx" ON "RentalReservation"("status", "startAt");

-- CreateIndex
CREATE INDEX "RentalReservation_bookingNo_idx" ON "RentalReservation"("bookingNo");

-- CreateIndex
CREATE INDEX "RentalReservationLine_reservationId_idx" ON "RentalReservationLine"("reservationId");

-- CreateIndex
CREATE INDEX "RentalReservationLine_listingId_idx" ON "RentalReservationLine"("listingId");

-- CreateIndex
CREATE INDEX "RentalUnitAllocation_unitId_startAt_endAt_idx" ON "RentalUnitAllocation"("unitId", "startAt", "endAt");

-- CreateIndex
CREATE INDEX "RentalUnitAllocation_reservationLineId_idx" ON "RentalUnitAllocation"("reservationLineId");

-- CreateIndex
CREATE INDEX "RentalPoolAllocation_reservationLineId_idx" ON "RentalPoolAllocation"("reservationLineId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalFulfillmentTask_reservationId_key" ON "RentalFulfillmentTask"("reservationId");

-- CreateIndex
CREATE INDEX "RentalFulfillmentTask_status_pickupAt_idx" ON "RentalFulfillmentTask"("status", "pickupAt");

-- CreateIndex
CREATE INDEX "RentalReservationEvent_reservationId_idx" ON "RentalReservationEvent"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalHandover_reservationId_key" ON "RentalHandover"("reservationId");

-- CreateIndex
CREATE INDEX "RentalHandoverItem_handoverId_idx" ON "RentalHandoverItem"("handoverId");

-- CreateIndex
CREATE INDEX "RentalHandoverAccessory_handoverItemId_idx" ON "RentalHandoverAccessory"("handoverItemId");

-- CreateIndex
CREATE INDEX "RentalEvidence_reservationId_stage_idx" ON "RentalEvidence"("reservationId", "stage");

-- CreateIndex
CREATE INDEX "RentalExtensionRequest_reservationId_status_idx" ON "RentalExtensionRequest"("reservationId", "status");

-- CreateIndex
CREATE INDEX "RentalIncident_reservationId_status_idx" ON "RentalIncident"("reservationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "RentalReturnCase_reservationId_key" ON "RentalReturnCase"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalReturnReceipt_returnCaseId_key" ON "RentalReturnReceipt"("returnCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalReturnReceipt_receiptNo_key" ON "RentalReturnReceipt"("receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "RentalInspection_reservationId_key" ON "RentalInspection"("reservationId");

-- CreateIndex
CREATE INDEX "RentalInspectionItem_inspectionId_idx" ON "RentalInspectionItem"("inspectionId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalSettlement_reservationId_key" ON "RentalSettlement"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "RentalClosure_reservationId_key" ON "RentalClosure"("reservationId");

-- CreateIndex
CREATE INDEX "RentalMaintenanceTask_unitId_status_idx" ON "RentalMaintenanceTask"("unitId", "status");

-- AddForeignKey
ALTER TABLE "AssetCategory" ADD CONSTRAINT "AssetCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "AssetCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocation" ADD CONSTRAINT "AssetLocation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "RentalCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetListing" ADD CONSTRAINT "AssetListing_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "RentalCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetListing" ADD CONSTRAINT "AssetListing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssetCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetListing" ADD CONSTRAINT "AssetListing_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "AssetBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocationOption" ADD CONSTRAINT "AssetLocationOption_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLocationOption" ADD CONSTRAINT "AssetLocationOption_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetUnit" ADD CONSTRAINT "AssetUnit_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetUnit" ADD CONSTRAINT "AssetUnit_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetRate" ADD CONSTRAINT "AssetRate_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetRentalPolicy" ADD CONSTRAINT "AssetRentalPolicy_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBlockedInterval" ADD CONSTRAINT "AssetBlockedInterval_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetBlockedInterval" ADD CONSTRAINT "AssetBlockedInterval_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAuditEvent" ADD CONSTRAINT "AssetAuditEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "RentalCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetAuditEvent" ADD CONSTRAINT "AssetAuditEvent_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "RentalCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequest" ADD CONSTRAINT "RentalRequest_returnLocationId_fkey" FOREIGN KEY ("returnLocationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalQuoteSnapshot" ADD CONSTRAINT "RentalQuoteSnapshot_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequestAddress" ADD CONSTRAINT "RentalRequestAddress_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalTermsAcceptance" ADD CONSTRAINT "RentalTermsAcceptance_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalRequestEvent" ADD CONSTRAINT "RentalRequestEvent_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalApprovalDecision" ADD CONSTRAINT "RentalApprovalDecision_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInventoryHold" ADD CONSTRAINT "RentalInventoryHold_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInventoryHold" ADD CONSTRAINT "RentalInventoryHold_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHoldUnit" ADD CONSTRAINT "RentalHoldUnit_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "RentalInventoryHold"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHoldUnit" ADD CONSTRAINT "RentalHoldUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalChangeProposal" ADD CONSTRAINT "RentalChangeProposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPaymentOrder" ADD CONSTRAINT "RentalPaymentOrder_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPaymentAttempt" ADD CONSTRAINT "RentalPaymentAttempt_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "RentalPaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPaymentReceipt" ADD CONSTRAINT "RentalPaymentReceipt_paymentOrderId_fkey" FOREIGN KEY ("paymentOrderId") REFERENCES "RentalPaymentOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalDepositLedger" ADD CONSTRAINT "RentalDepositLedger_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservationLine" ADD CONSTRAINT "RentalReservationLine_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservationLine" ADD CONSTRAINT "RentalReservationLine_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "AssetListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalUnitAllocation" ADD CONSTRAINT "RentalUnitAllocation_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "RentalReservationLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalUnitAllocation" ADD CONSTRAINT "RentalUnitAllocation_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalPoolAllocation" ADD CONSTRAINT "RentalPoolAllocation_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "RentalReservationLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalFulfillmentTask" ADD CONSTRAINT "RentalFulfillmentTask_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalFulfillmentTask" ADD CONSTRAINT "RentalFulfillmentTask_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AssetLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservationEvent" ADD CONSTRAINT "RentalReservationEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHandover" ADD CONSTRAINT "RentalHandover_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHandoverItem" ADD CONSTRAINT "RentalHandoverItem_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "RentalHandover"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHandoverItem" ADD CONSTRAINT "RentalHandoverItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalHandoverAccessory" ADD CONSTRAINT "RentalHandoverAccessory_handoverItemId_fkey" FOREIGN KEY ("handoverItemId") REFERENCES "RentalHandoverItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalEvidence" ADD CONSTRAINT "RentalEvidence_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalExtensionRequest" ADD CONSTRAINT "RentalExtensionRequest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalIncident" ADD CONSTRAINT "RentalIncident_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReturnCase" ADD CONSTRAINT "RentalReturnCase_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReturnReceipt" ADD CONSTRAINT "RentalReturnReceipt_returnCaseId_fkey" FOREIGN KEY ("returnCaseId") REFERENCES "RentalReturnCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInspection" ADD CONSTRAINT "RentalInspection_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInspectionItem" ADD CONSTRAINT "RentalInspectionItem_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "RentalInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalInspectionItem" ADD CONSTRAINT "RentalInspectionItem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalSettlement" ADD CONSTRAINT "RentalSettlement_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalClosure" ADD CONSTRAINT "RentalClosure_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalMaintenanceTask" ADD CONSTRAINT "RentalMaintenanceTask_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "AssetUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
