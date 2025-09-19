import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile, validateFile, extractFileFromRequest } from '@/lib/fileUpload'

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

// GET /api/pv-departement/[id] - Get a specific PV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const pv = await prisma.pvDepartement.findUnique({
      where: { code: id },
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

    if (!pv) {
      const response = NextResponse.json(
        { error: 'PV not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json(pv)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching pv departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch pv departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// PUT /api/pv-departement/[id] - Update a PV
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si le PV existe
    const existingPv = await prisma.pvDepartement.findUnique({
      where: { code: id }
    })

    if (!existingPv) {
      const response = NextResponse.json(
        { error: 'PV not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const { file, formData } = await extractFileFromRequest(request)
    const libelle = formData.get('libelle') as string

    if (!libelle) {
      const response = NextResponse.json(
        { error: 'libelle is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const updateData: Record<string, unknown> = {
      libelle
    }

    // Si un nouveau fichier est fourni, le traiter
    if (file) {
      // Valider le fichier
      const validation = validateFile(file)
      if (!validation.isValid) {
        const response = NextResponse.json(
          { error: validation.error },
          { status: 400 }
        )
        response.headers.set('Access-Control-Allow-Origin', '*')
        return response
      }

      // Sauvegarder le nouveau fichier
      const fileInfo = await saveFile(file)
      updateData.url_pv = fileInfo.path
      updateData.hash_file = fileInfo.hash
    }

    const pv = await prisma.pvDepartement.update({
      where: { code: id },
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
        }
      }
    })

    const response = NextResponse.json(pv)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error updating pv departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to update pv departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// DELETE /api/pv-departement/[id] - Delete a PV
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params
    const id = parseInt(idParam)

    if (isNaN(id)) {
      const response = NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si le PV existe
    const existingPv = await prisma.pvDepartement.findUnique({
      where: { code: id }
    })

    if (!existingPv) {
      const response = NextResponse.json(
        { error: 'PV not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    await prisma.pvDepartement.delete({
      where: { code: id }
    })

    const response = NextResponse.json(
      { message: 'PV deleted successfully' },
      { status: 200 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error deleting pv departement:', error)
    const response = NextResponse.json(
      { error: 'Failed to delete pv departement' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
