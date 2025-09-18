import { NextRequest, NextResponse } from 'next/server'
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

// GET /api/bureaux-vote - Get all bureaux de vote (helper endpoint for dropdowns)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const arrondissementCode = searchParams.get('arrondissement')
    const departementCode = searchParams.get('departement')
    
    const where: Record<string, unknown> = {}
    
    if (arrondissementCode) {
      where.code_arrondissement = parseInt(arrondissementCode)
    }
    
    if (departementCode) {
      where.arrondissement = {
        code_departement: parseInt(departementCode)
      }
    }

    const bureauxVote = await prisma.bureauVote.findMany({
      where,
      select: {
        code: true,
        designation: true,
        description: true,
        latitude: true,
        longitude: true,
        effectif: true,
        arrondissement: {
          select: {
            code: true,
            libelle: true,
            abbreviation: true,
            departement: {
              select: {
                code: true,
                libelle: true,
                abbreviation: true,
                region: {
                  select: {
                    code: true,
                    libelle: true,
                    abbreviation: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { arrondissement: { libelle: 'asc' } },
        { designation: 'asc' }
      ]
    })

    const response = NextResponse.json(bureauxVote)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching bureaux de vote:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch bureaux de vote' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}