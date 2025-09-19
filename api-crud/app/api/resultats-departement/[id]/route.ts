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

// GET /api/resultats-departement/[id] - Get a specific result
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)

    if (isNaN(idNum)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const resultat = await prisma.resultatDepartement.findUnique({
      where: { code: idNum },
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
        },
        parti: {
          select: {
            code: true,
            designation: true,
            abbreviation: true,
            description: true,
            coloration_bulletin: true,
            image: true
          }
        }
      }
    })

    if (!resultat) {
      const response = NextResponse.json(
        { error: 'Resultat not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json(resultat)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching resultat departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch resultat departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// PUT /api/resultats-departement/[id] - Update a result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)
    const body = await request.json()
    const {
      code_departement,
      code_parti,
      nombre_vote,
      pourcentage
    } = body

    if (isNaN(idNum)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si le résultat existe
    const existingResult = await prisma.resultatDepartement.findUnique({
      where: { code: idNum }
    })

    if (!existingResult) {
      const response = NextResponse.json(
        { error: 'Resultat not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Si on change le département ou le parti, vérifier qu'il n'y a pas de conflit
    if (code_departement || code_parti) {
      const newDepartement = code_departement ? parseInt(code_departement) : existingResult.code_departement
      const newParti = code_parti ? parseInt(code_parti) : existingResult.code_parti

      const conflictResult = await prisma.resultatDepartement.findFirst({
        where: {
          code_departement: newDepartement,
          code_parti: newParti,
          code: { not: idNum }
        }
      })

      if (conflictResult) {
        const response = NextResponse.json(
          { error: 'Un résultat existe déjà pour ce département et ce parti' },
          { status: 409 }
        )
        response.headers.set('Access-Control-Allow-Origin', '*')
        return response
      }
    }

    const updateData: Record<string, unknown> = {}
    if (code_departement !== undefined) updateData.code_departement = parseInt(code_departement)
    if (code_parti !== undefined) updateData.code_parti = parseInt(code_parti)
    if (nombre_vote !== undefined) updateData.nombre_vote = parseInt(nombre_vote)
    if (pourcentage !== undefined) updateData.pourcentage = pourcentage ? parseFloat(pourcentage) : null

    const resultat = await prisma.resultatDepartement.update({
      where: { code: idNum },
      data: updateData,
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
        },
        parti: {
          select: {
            code: true,
            designation: true,
            abbreviation: true,
            description: true,
            coloration_bulletin: true,
            image: true
          }
        }
      }
    })

    const response = NextResponse.json(resultat)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error updating resultat departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to update resultat departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// DELETE /api/resultats-departement/[id] - Delete a result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idNum = parseInt(id)

    if (isNaN(idNum)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si le résultat existe
    const existingResult = await prisma.resultatDepartement.findUnique({
      where: { code: idNum }
    })

    if (!existingResult) {
      const response = NextResponse.json(
        { error: 'Resultat not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    await prisma.resultatDepartement.delete({
      where: { code: idNum }
    })

    const response = NextResponse.json(
      { message: 'Resultat deleted successfully' },
      { status: 200 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error deleting resultat departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to delete resultat departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
