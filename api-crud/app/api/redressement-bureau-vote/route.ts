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

// GET /api/redressement-bureau-vote - Get all redressements bureau vote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bureauVoteCode = searchParams.get('bureau_vote')
    const arrondissementCode = searchParams.get('arrondissement')
    const departementCode = searchParams.get('departement')
    
    const where: Record<string, unknown> = {}
    
    if (bureauVoteCode) {
      where.code_bureau_vote = parseInt(bureauVoteCode)
    }

    // Si on filtre par arrondissement, on doit joindre avec les bureaux de vote
    if (arrondissementCode) {
      where.bureauVote = {
        code_arrondissement: parseInt(arrondissementCode)
      }
    }

    // Si on filtre par département
    if (departementCode) {
      where.bureauVote = {
        arrondissement: {
          code_departement: parseInt(departementCode)
        }
      }
    }

    const redressements = await prisma.redressementBureauVote.findMany({
      where,
      include: {
        bureauVote: {
          select: {
            code: true,
            designation: true,
            description: true,
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
          }
        }
      },
      orderBy: [
        { date_redressement: 'desc' },
        { bureauVote: { designation: 'asc' } }
      ]
    })

    const response = NextResponse.json(redressements)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching redressements bureau vote:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch redressements bureau vote' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// POST /api/redressement-bureau-vote - Create a new redressement bureau vote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      code_bureau_vote,
      nombre_inscrit_initial,
      nombre_inscrit_redresse,
      nombre_votant_initial,
      nombre_votant_redresse,
      taux_participation_initial,
      taux_participation_redresse,
      bulletin_nul_initial,
      bulletin_nul_redresse,
      suffrage_exprime_valables_initial,
      suffrage_exprime_valables_redresse,
      erreurs_materielles_initiales,
      erreurs_materielles_initiales_redresse,
      raison_redressement
    } = body

    if (!code_bureau_vote) {
      const response = NextResponse.json(
        { error: 'code_bureau_vote is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si un redressement existe déjà pour ce bureau de vote
    const existingRedressement = await prisma.redressementBureauVote.findUnique({
      where: { code_bureau_vote: parseInt(code_bureau_vote) }
    })

    if (existingRedressement) {
      const response = NextResponse.json(
        { error: 'Un redressement existe déjà pour ce bureau de vote' },
        { status: 409 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const redressement = await prisma.redressementBureauVote.create({
      data: {
        code_bureau_vote: parseInt(code_bureau_vote),
        nombre_inscrit_initial: nombre_inscrit_initial ? parseInt(nombre_inscrit_initial) : null,
        nombre_inscrit_redresse: nombre_inscrit_redresse ? parseInt(nombre_inscrit_redresse) : null,
        nombre_votant_initial: nombre_votant_initial ? parseInt(nombre_votant_initial) : null,
        nombre_votant_redresse: nombre_votant_redresse ? parseInt(nombre_votant_redresse) : null,
        taux_participation_initial: taux_participation_initial ? parseFloat(taux_participation_initial) : null,
        taux_participation_redresse: taux_participation_redresse ? parseFloat(taux_participation_redresse) : null,
        bulletin_nul_initial: bulletin_nul_initial ? parseInt(bulletin_nul_initial) : null,
        bulletin_nul_redresse: bulletin_nul_redresse ? parseInt(bulletin_nul_redresse) : null,
        suffrage_exprime_valables_initial: suffrage_exprime_valables_initial ? parseInt(suffrage_exprime_valables_initial) : null,
        suffrage_exprime_valables_redresse: suffrage_exprime_valables_redresse ? parseInt(suffrage_exprime_valables_redresse) : null,
        erreurs_materielles_initiales,
        erreurs_materielles_initiales_redresse,
        raison_redressement,
        date_redressement: new Date()
      },
      include: {
        bureauVote: {
          select: {
            code: true,
            designation: true,
            description: true,
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
        }
      }
    })

    const response = NextResponse.json(redressement, { status: 201 })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error creating redressement bureau vote:', error)
    const response = NextResponse.json(
      { error: 'Failed to create redressement bureau vote' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}