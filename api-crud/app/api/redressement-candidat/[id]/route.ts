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

// GET /api/redressement-candidat/[id] - Get redressement candidat by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const redressementId = parseInt(id)

    if (isNaN(redressementId)) {
      const response = NextResponse.json(
        { error: 'Invalid redressement ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const redressement = await prisma.redressementCandidat.findUnique({
      where: { code: redressementId },
      include: {
        bureauVote: {
          select: {
            code: true,
            designation: true,
            arrondissement: {
              select: {
                code: true,
                libelle: true,
                abbreviation: true,
                departement: {
                  select: {
                    code: true,
                    libelle: true,
                    abbreviation: true
                  }
                }
              }
            }
          }
        },
        parti: {
          select: {
            code: true,
            designation: true,
            abbreviation: true,
            coloration_bulletin: true,
            candidat: {
              select: {
                code: true,
                nomsPrenoms: true
              }
            }
          }
        }
      }
    })

    if (!redressement) {
      const response = NextResponse.json(
        { error: 'Redressement not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json(redressement)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching redressement candidat:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch redressement candidat' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// PUT /api/redressement-candidat/[id] - Update redressement candidat
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const redressementId = parseInt(id)

    if (isNaN(redressementId)) {
      const response = NextResponse.json(
        { error: 'Invalid redressement ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const body = await request.json()
    const {
      nombre_vote_initial,
      nombre_vote_redresse,
      raison_redressement
    } = body

    const redressement = await prisma.redressementCandidat.update({
      where: { code: redressementId },
      data: {
        nombre_vote_initial: nombre_vote_initial ? parseInt(nombre_vote_initial) : null,
        nombre_vote_redresse: nombre_vote_redresse ? parseInt(nombre_vote_redresse) : null,
        raison_redressement,
        date_redressement: new Date()
      },
      include: {
        bureauVote: {
          select: {
            code: true,
            designation: true,
            arrondissement: {
              select: {
                code: true,
                libelle: true,
                abbreviation: true
              }
            }
          }
        },
        parti: {
          select: {
            code: true,
            designation: true,
            abbreviation: true,
            candidat: {
              select: {
                code: true,
                nomsPrenoms: true
              }
            }
          }
        }
      }
    })

    const response = NextResponse.json(redressement)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error updating redressement candidat:', error)
    const response = NextResponse.json(
      { error: 'Failed to update redressement candidat' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// DELETE /api/redressement-candidat/[id] - Delete redressement candidat
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const redressementId = parseInt(id)

    if (isNaN(redressementId)) {
      const response = NextResponse.json(
        { error: 'Invalid redressement ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    await prisma.redressementCandidat.delete({
      where: { code: redressementId }
    })

    const response = NextResponse.json({ message: 'Redressement candidat deleted successfully' })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error deleting redressement candidat:', error)
    const response = NextResponse.json(
      { error: 'Failed to delete redressement candidat' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}