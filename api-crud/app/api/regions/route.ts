import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// GET /api/regions - Get all regions (helper endpoint for dropdowns)
export async function GET() {
  try {
    const regions = await prisma.region.findMany({
      select: {
        code: true,
        libelle: true,
        abbreviation: true,
        chef_lieu: true,
        departements: {
          select: {
            code: true,
            libelle: true,
            abbreviation: true
          }
        }
      },
      orderBy: {
        libelle: 'asc'
      }
    })

    const response = NextResponse.json(regions)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching regions:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
