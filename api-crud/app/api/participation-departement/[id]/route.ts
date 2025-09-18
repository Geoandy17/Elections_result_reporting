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

// GET /api/participation-departement/[id] - Get participation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const participationId = parseInt(id)

    if (isNaN(participationId)) {
      const response = NextResponse.json(
        { error: 'Invalid participation ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const participation = await prisma.participationDepartement.findUnique({
      where: { code: participationId },
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
      }
    })

    if (!participation) {
      const response = NextResponse.json(
        { error: 'Participation not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json(participation)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching participation:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch participation' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// PUT /api/participation-departement/[id] - Update participation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const participationId = parseInt(id)

    if (isNaN(participationId)) {
      const response = NextResponse.json(
        { error: 'Invalid participation ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const body = await request.json()
    const {
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

    const participation = await prisma.participationDepartement.update({
      where: { code: participationId },
      data: {
        nombreBureauVote: parseInt(nombre_bureau_vote) || 0,
        nombreInscrit: parseInt(nombre_inscrit) || 0,
        nombreEnveloppeUrnes: parseInt(nombre_enveloppe_urnes) || 0,
        enveloppesContBulletinsDifferents: parseInt(nombre_enveloppe_bulletins_differents) || 0,
        bulletinsAvecSignes: parseInt(nombre_bulletin_electeur_identifiable) || 0,
        bulletinsDansEnveloppesAvecSignes: parseInt(nombre_bulletin_enveloppes_signes) || 0,
        enveloppesAutresQueElecam: parseInt(nombre_enveloppe_non_elecam) || 0,
        bulletinsAutresQueElecam: parseInt(nombre_bulletin_non_elecam) || 0,
        bulletinsSansEnveloppes: parseInt(nombre_bulletin_sans_enveloppe) || 0,
        enveloppesVides: parseInt(nombre_enveloppe_vide) || 0,
        nombreVotant: parseInt(nombre_votant) || 0,
        bulletinNul: parseInt(bulletin_nul) || 0,
        suffrageExprime: parseInt(suffrage_exprime) || 0,
        tauxParticipation: taux_participation ? parseFloat(taux_participation) : null
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

    const response = NextResponse.json(participation)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error updating participation:', error)
    const response = NextResponse.json(
      { error: 'Failed to update participation' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// DELETE /api/participation-departement/[id] - Delete participation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const participationId = parseInt(id)

    if (isNaN(participationId)) {
      const response = NextResponse.json(
        { error: 'Invalid participation ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    await prisma.participationDepartement.delete({
      where: { code: participationId }
    })

    const response = NextResponse.json({ message: 'Participation deleted successfully' })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error deleting participation:', error)
    const response = NextResponse.json(
      { error: 'Failed to delete participation' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
