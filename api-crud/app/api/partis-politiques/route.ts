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

// GET /api/partis-politiques - Get all partis politiques (helper endpoint for dropdowns)
export async function GET() {
  try {
    const partis = await prisma.partiPolitique.findMany({
      select: {
        code: true,
        designation: true,
        abbreviation: true,
        coloration_bulletin: true,
        image: true,
        candidat: {
          select: {
            code: true,
            nomsPrenoms: true,
            photo: true
          }
        }
      },
      orderBy: {
        designation: 'asc'
      }
    })

    const response = NextResponse.json(partis)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching partis politiques:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch partis politiques' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}