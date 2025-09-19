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

// GET /api/redressement-candidat - Get all redressements candidat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bureauVoteCode = searchParams.get('bureau_vote')
    const partiCode = searchParams.get('parti')
    const arrondissementCode = searchParams.get('arrondissement')
    
    const where: Record<string, unknown> = {}
    
    if (bureauVoteCode) {
      where.code_bureau_vote = parseInt(bureauVoteCode)
    }
    
    if (partiCode) {
      where.code_parti = parseInt(partiCode)
    }

    // Si on filtre par arrondissement, on doit joindre avec les bureaux de vote
    if (arrondissementCode) {
      where.bureauVote = {
        code_arrondissement: parseInt(arrondissementCode)
      }
    }

    const redressements = await prisma.redressementCandidat.findMany({
      where,
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
                noms_prenoms: true
              }
            }
          }
        }
      },
      orderBy: [
        { date_redressement: 'desc' },
        { bureauVote: { designation: 'asc' } },
        { parti: { designation: 'asc' } }
      ]
    })

    const response = NextResponse.json(redressements)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching redressements candidat:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch redressements candidat' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// POST /api/redressement-candidat - Create a new redressement candidat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code_bureau_vote,
      code_parti,
      nombre_vote_initial,
      nombre_vote_redresse,
      raison_redressement
    } = body

    if (!code_bureau_vote || !code_parti) {
      const response = NextResponse.json(
        { error: 'code_bureau_vote and code_parti are required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const redressement = await prisma.redressementCandidat.create({
      data: {
        code_bureau_vote: parseInt(code_bureau_vote),
        code_parti: parseInt(code_parti),
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
                noms_prenoms: true
              }
            }
          }
        }
      }
    })

    const response = NextResponse.json(redressement, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error creating redressement candidat:', error)
    const response = NextResponse.json(
      { error: 'Failed to create redressement candidat' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}