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

// GET /api/membre-commission - Get all members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const commissionCode = searchParams.get('commission')
    const fonctionCode = searchParams.get('fonction')
    
    const where: Record<string, unknown> = {}
    
    if (commissionCode) {
      where.code_commission = parseInt(commissionCode)
    }
    
    if (fonctionCode) {
      where.code_fonction = parseInt(fonctionCode)
    }

    const membres = await prisma.membreCommission.findMany({
      where,
      include: {
        fonction: {
          select: {
            code: true,
            libelle: true,
            description: true
          }
        },
        commission: {
          select: {
            code: true,
            libelle: true,
            departement: {
              select: {
                code: true,
                libelle: true,
                abbreviation: true
              }
            }
          }
        }
      },
      orderBy: [
        { commission: { libelle: 'asc' } },
        { fonction: { libelle: 'asc' } },
        { nom: 'asc' }
      ]
    })

    const response = NextResponse.json(membres)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching members:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// POST /api/membre-commission - Create a new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nom, 
      code_fonction, 
      code_commission, 
      contact, 
      email, 
      est_membre_secretariat 
    } = body

    if (!nom || !code_fonction) {
      const response = NextResponse.json(
        { error: 'nom and code_fonction are required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const membre = await prisma.membreCommission.create({
      data: {
        nom,
        code_fonction: parseInt(code_fonction),
        code_commission: code_commission ? parseInt(code_commission) : null,
        contact,
        email,
        est_membre_secretariat: Boolean(est_membre_secretariat)
      },
      include: {
        fonction: {
          select: {
            code: true,
            libelle: true
          }
        },
        commission: {
          select: {
            code: true,
            libelle: true
          }
        }
      }
    })

    const response = NextResponse.json(membre, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error creating member:', error)
    const response = NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
