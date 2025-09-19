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

// GET /api/participation-departement - Get all participations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departementCode = searchParams.get('departement')
    const regionCode = searchParams.get('region')
    
    const where: Record<string, unknown> = {}
    
    if (departementCode) {
      where.code_departement = parseInt(departementCode)
    }
    
    // Si on filtre par région, on doit joindre avec les départements
    if (regionCode) {
      where.departement = {
        code_region: parseInt(regionCode)
      }
    }

    const participations = await prisma.participationDepartement.findMany({
      where,
      include: {
        departement: {
          select: {
            code: true,
            libelle: true,
            abbreviation: true,
            chef_lieu: true,
            region: {
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
        { departement: { region: { libelle: 'asc' } } },
        { departement: { libelle: 'asc' } }
      ]
    })

    const response = NextResponse.json(participations)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching participations:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch participations' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// POST /api/participation-departement - Create a new participation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code_departement,
      nombre_bureau_vote,
      nombre_inscrit,
      nombre_enveloppe_urnes,
      nombre_enveloppe_bulletins_differents,
      nombre_bulletin_electeur_identifiable,
      nombre_bulletin_enveloppes_signes,
      nombre_enveloppe_non_elecam,
      nombre_bulletin_non_elecam,
      nombre_bulletin_sans_enveloppe,
      nombre_enveloppe_vide,
      nombre_suffrages_valable,
      nombre_votant,
      bulletin_nul,
      suffrage_exprime,
      taux_participation
    } = body

    if (!code_departement) {
      const response = NextResponse.json(
        { error: 'code_departement is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si une participation existe déjà pour ce département
    const existingParticipation = await prisma.participationDepartement.findUnique({
      where: { code_departement: parseInt(code_departement) }
    })

    if (existingParticipation) {
      const response = NextResponse.json(
        { error: 'Une participation existe déjà pour ce département' },
        { status: 409 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const participation = await prisma.participationDepartement.create({
      data: {
        code_departement: parseInt(code_departement),
        nombre_bureau_vote: parseInt(nombre_bureau_vote) || 0,
        nombre_inscrit: parseInt(nombre_inscrit) || 0,
        nombre_enveloppe_urnes: parseInt(nombre_enveloppe_urnes) || 0,
        nombre_enveloppe_bulletins_differents: parseInt(nombre_enveloppe_bulletins_differents) || 0,
        nombre_bulletin_electeur_identifiable: parseInt(nombre_bulletin_electeur_identifiable) || 0,
        nombre_bulletin_enveloppes_signes: parseInt(nombre_bulletin_enveloppes_signes) || 0,
        nombre_enveloppe_non_elecam: parseInt(nombre_enveloppe_non_elecam) || 0,
        nombre_bulletin_non_elecam: parseInt(nombre_bulletin_non_elecam) || 0,
        nombre_bulletin_sans_enveloppe: parseInt(nombre_bulletin_sans_enveloppe) || 0,
        nombre_enveloppe_vide: parseInt(nombre_enveloppe_vide) || 0,
        nombre_suffrages_valable: parseInt(nombre_suffrages_valable) || 0,
        nombre_votant: parseInt(nombre_votant) || 0,
        bulletin_nul: parseInt(bulletin_nul) || 0,
        suffrage_exprime: suffrage_exprime ? parseFloat(suffrage_exprime) : null,
        taux_participation: taux_participation ? parseFloat(taux_participation) : null,
        date_creation: new Date().toISOString()
      },
      include: {
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
    })

    const response = NextResponse.json(participation, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error creating participation:', error)
    const response = NextResponse.json(
      { error: 'Failed to create participation' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
