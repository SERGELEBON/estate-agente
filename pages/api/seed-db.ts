import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.NEXTAUTH_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const adminPassword = await hash('Admin@2024', 12)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@state-immocom.com' },
      update: {},
      create: {
        email: 'admin@state-immocom.com',
        name: 'State ImmoCom Admin',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+233 20 000 0001',
        company: 'State-ImmoCom',
        bio: 'Platform administrator',
      },
    })

    const agentPassword = await hash('Agent@2024', 12)
    const agent = await prisma.user.upsert({
      where: { email: 'kwame@state-immocom.com' },
      update: {},
      create: {
        email: 'kwame@state-immocom.com',
        name: 'Kwame Asante',
        password: agentPassword,
        role: 'AGENT',
        phone: '+233 20 111 2222',
        company: 'GoldKey Realty',
        license: 'GH-RL-2024-001',
        bio: 'Experienced real estate agent',
      },
    })

    const properties = [
      {
        title: 'Luxury 4-Bedroom Villa with Pool',
        slug: 'luxury-4bed-villa-east-legon',
        description: 'Stunning modern villa in East Legon with pool, gym, and 24/7 security.',
        price: 2500000,
        location: 'East Legon, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        type: 'VILLA',
        status: 'AVAILABLE',
        listingType: 'SALE',
        bedrooms: 4,
        bathrooms: 3,
        area: 450,
        furnished: false,
        parking: true,
        pool: true,
        gym: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        ]),
        featured: true,
        agentId: agent.id,
      },
      {
        title: 'Modern 3-Bedroom Apartment',
        slug: 'modern-3bed-apartment-airport',
        description: 'Contemporary apartment in Airport Residential with stunning views.',
        price: 850000,
        location: 'Airport Residential, Accra',
        city: 'Accra',
        region: 'Greater Accra',
        type: 'APARTMENT',
        status: 'AVAILABLE',
        listingType: 'SALE',
        bedrooms: 3,
        bathrooms: 2,
        area: 180,
        furnished: true,
        parking: true,
        pool: true,
        gym: true,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        ]),
        featured: true,
        agentId: agent.id,
      },
    ]

    for (const prop of properties) {
      await prisma.property.upsert({
        where: { slug: prop.slug },
        update: {},
        create: prop,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully',
      users: 2,
      properties: properties.length,
    })
  } catch (error: any) {
    console.error('Seed error:', error)
    return res.status(500).json({
      error: 'Failed to seed database',
      details: error.message,
    })
  }
}
