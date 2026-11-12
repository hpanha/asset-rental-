import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''
    const category = searchParams.get('category') || ''
    const city = searchParams.get('city')?.trim() || ''
    const minPrice = Number(searchParams.get('minPrice')) || 0
    const maxPrice = Number(searchParams.get('maxPrice')) || 0
    const sort = searchParams.get('sort') || 'popular'
    const limit = Number(searchParams.get('limit')) || 0

    const where: any = {
      visibility: 'PUBLISHED', // Only published assets in public marketplace
    }

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { code: { contains: q } },
        { shortDescription: { contains: q } },
        { description: { contains: q } },
        { model: { contains: q } },
      ]
    }

    if (category) {
      where.OR = [
        { category: { slug: category } },
        { category: { parent: { slug: category } } },
      ]
    }

    if (city) {
      where.locationOptions = {
        some: {
          location: {
            city: { contains: city },
          },
        },
      }
    }

    let orderBy: any = { rating: 'desc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }
    else if (sort === 'popular') orderBy = { reviewCount: 'desc' }
    else if (sort === 'newest') orderBy = { createdAt: 'desc' }

    const findManyArgs: any = {
      where,
      orderBy,
      include: {
        category: true,
        brand: true,
        rates: { where: { isPrimary: true }, take: 1 },
        rentalPolicy: true,
        locationOptions: {
          include: { location: true },
        },
        units: {
          select: { id: true, baseStatus: true },
        },
      },
    }
    if (limit) findManyArgs.take = limit

    const listings = await db.assetListing.findMany(findManyArgs)

    const formatted = listings.map((item) => {
      const primaryRate = item.rates[0]?.rateAmount || 0
      let images: string[] = []
      try {
        images = item.images ? JSON.parse(item.images) : []
      } catch {
        images = []
      }
      if (item.coverImage && !images.includes(item.coverImage)) {
        images.unshift(item.coverImage)
      }

      let features: string[] = []
      try {
        if (item.specifications) {
          const parsed = JSON.parse(item.specifications)
          features = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`)
        }
      } catch {
        features = []
      }

      const activeUnits = item.units.filter((u) => u.baseStatus === 'ACTIVE').length
      const primaryCity = item.locationOptions[0]?.location.city || 'Phnom Penh'
      const primaryLocName = item.locationOptions[0]?.location.name || 'Phnom Penh Logistics Hub'

      return {
        id: item.id,
        title: item.name,
        name: item.name,
        code: item.code,
        slug: item.slug,
        description: item.shortDescription || item.description || '',
        fullDescription: item.description,
        categoryId: item.categoryId,
        location: primaryLocName,
        city: primaryCity,
        pricePerDay: primaryRate,
        deposit: item.rentalPolicy?.securityDeposit || 0,
        images,
        features,
        status: activeUnits > 0 ? 'available' : 'unavailable',
        rating: item.rating,
        reviewCount: item.reviewCount,
        createdAt: item.createdAt.toISOString(),
        totalUnits: item.units.length,
        availableUnitsCount: activeUnits,
        category: {
          id: item.category.id,
          name: item.category.name,
          slug: item.category.slug,
          icon: item.category.iconName || 'Folder',
          color: item.category.color || 'emerald',
          imageUrl: item.category.imageUrl,
        },
        brand: item.brand,
        owner: {
          id: 'company',
          name: 'RentHub Enterprise',
          avatar: null,
          bio: 'Verified Rental Company',
        },
      }
    })

    if (sort === 'priceLow') {
      formatted.sort((a, b) => a.pricePerDay - b.pricePerDay)
    } else if (sort === 'priceHigh') {
      formatted.sort((a, b) => b.pricePerDay - a.pricePerDay)
    }

    if (minPrice || maxPrice) {
      return NextResponse.json(
        formatted.filter((a) => {
          if (minPrice && a.pricePerDay < minPrice) return false
          if (maxPrice && a.pricePerDay > maxPrice) return false
          return true
        })
      )
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error('Error in GET /api/assets:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch assets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.title || !body.description || !body.pricePerDay) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let company = await db.rentalCompany.findFirst()
    if (!company) {
      company = await db.rentalCompany.create({
        data: {
          name: 'RentHub Enterprise Rentals',
          legalName: 'RentHub Equipment Solutions Co., Ltd.',
          currency: 'USD',
          timezone: 'Asia/Phnom_Penh',
          phone: '+855 23 888 999',
          email: 'operations@renthub.app',
          address: 'Plot 120, Street 2004, Sen Sok, Phnom Penh, Cambodia',
        },
      })
    }

    let category = body.categorySlug
      ? await db.assetCategory.findFirst({
          where: { slug: body.categorySlug },
        })
      : null

    if (!category) {
      category = await db.assetCategory.findFirst({ where: { status: 'ACTIVE' } })
    }

    if (!category) {
      category = await db.assetCategory.create({
        data: {
          name: body.categorySlug
            ? body.categorySlug.charAt(0).toUpperCase() + body.categorySlug.slice(1).replace(/-/g, ' ')
            : 'General Equipment',
          slug: body.categorySlug || 'general',
          shortDescription: 'General rental equipment and gear.',
          iconName: 'Package',
          color: '#10B981',
          status: 'ACTIVE',
        },
      })
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString()
    const codePrefix = body.title.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') || 'AST'
    const code = `AST-${codePrefix}-${randomSuffix}`
    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')}-${randomSuffix}`
    const images = Array.isArray(body.images) && body.images.length ? body.images : ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800']

    let location = await db.assetLocation.findFirst()
    if (!location) {
      location = await db.assetLocation.create({
        data: {
          companyId: company.id,
          name: 'Phnom Penh Central Logistics Hub',
          code: 'PNH-01',
          address: 'Building 42, Norodom Blvd, Daun Penh',
          city: body.city || 'Phnom Penh',
          timezone: 'Asia/Phnom_Penh',
          isPickupDefault: true,
          isActive: true,
        },
      })
    }

    const newListing = await db.$transaction(async (tx) => {
      const listing = await tx.assetListing.create({
        data: {
          companyId: company.id,
          code,
          name: body.title,
          slug,
          categoryId: category.id,
          shortDescription: body.description.slice(0, 180),
          description: body.description,
          coverImage: images[0],
          images: JSON.stringify(images),
          visibility: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })

      await tx.assetRate.create({
        data: {
          listingId: listing.id,
          currency: 'USD',
          billingUnit: 'DAY',
          rateAmount: Number(body.pricePerDay),
          isPrimary: true,
        },
      })

      await tx.assetRentalPolicy.create({
        data: {
          listingId: listing.id,
          securityDeposit: Number(body.deposit) || 0,
          minimumDuration: 1,
          minimumDurationUnit: 'DAY',
          lateFeeAmount: 25.00,
          lateFeeUnit: 'DAY',
          preparationBufferMinutes: 120,
          returnBufferMinutes: 120,
        },
      })

      if (location) {
        await tx.assetLocationOption.create({
          data: {
            listingId: listing.id,
            locationId: location.id,
            pickupEnabled: true,
            returnEnabled: true,
          },
        })

        await tx.assetUnit.create({
          data: {
            listingId: listing.id,
            assetTag: `TO-${code}`,
            locationId: location.id,
            baseStatus: 'ACTIVE',
            conditionGrade: 'EXCELLENT',
          },
        })
      }

      await tx.assetAuditEvent.create({
        data: {
          companyId: company.id,
          listingId: listing.id,
          entityType: 'LISTING',
          entityId: listing.id,
          actorName: 'Admin',
          action: 'PUBLISH',
          afterJson: JSON.stringify({ code: listing.code, name: listing.name }),
        },
      })

      return listing
    })

    return NextResponse.json({
      id: newListing.id,
      title: newListing.name,
      pricePerDay: Number(body.pricePerDay),
      status: 'available',
    })
  } catch (error: any) {
    console.error('Error in POST /api/assets:', error)
    return NextResponse.json({ error: error.message || 'Failed to create listing' }, { status: 500 })
  }
}

