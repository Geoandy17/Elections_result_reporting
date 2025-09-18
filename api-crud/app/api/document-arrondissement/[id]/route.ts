import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile, validateFile, extractFileFromRequest } from '@/lib/fileUpload'
import { unlink } from 'fs/promises'
import { join } from 'path'

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

// GET /api/document-arrondissement/[id] - Get document by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      const response = NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const document = await prisma.pvArrondissement.findUnique({
      where: { code: documentId },
      include: {
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
            },
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

    if (!document) {
      const response = NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const response = NextResponse.json(document)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error fetching document:', error)
    const response = NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// PUT /api/document-arrondissement/[id] - Update document
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      const response = NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Vérifier si le document existe
    const existingDocument = await prisma.pvArrondissement.findUnique({
      where: { code: documentId }
    })

    if (!existingDocument) {
      const response = NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const { file, formData } = await extractFileFromRequest(request)
    
    // Récupérer les données du formulaire
    const libelle = formData.get('libelle') as string
    
    if (!libelle) {
      const response = NextResponse.json(
        { error: 'libelle is required' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    const updateData: { libelle: string; timestamp: Date; url_pv?: string; hash_file?: string } = {
      libelle,
      timestamp: new Date()
    }

    // Si un nouveau fichier est fourni, le traiter
    if (file) {
      // Valider le nouveau fichier
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

      // Supprimer l'ancien fichier si il existe
      if (existingDocument.url_pv) {
        try {
          const oldFilePath = join(process.cwd(), 'public', existingDocument.url_pv)
          await unlink(oldFilePath)
        } catch (error) {
          console.warn('Could not delete old file:', error)
        }
      }

      updateData.url_pv = fileInfo.path
      updateData.hash_file = fileInfo.hash
    }

    // Mettre à jour le document
    const document = await prisma.pvArrondissement.update({
      where: { code: documentId },
      data: updateData,
      include: {
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
    })

    const response = NextResponse.json(document)
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error updating document:', error)
    const response = NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}

// DELETE /api/document-arrondissement/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      const response = NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Récupérer le document pour obtenir le chemin du fichier
    const document = await prisma.pvArrondissement.findUnique({
      where: { code: documentId }
    })

    if (!document) {
      const response = NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    }

    // Supprimer le fichier physique
    if (document.url_pv) {
      try {
        const filePath = join(process.cwd(), 'public', document.url_pv)
        await unlink(filePath)
      } catch (error) {
        console.warn('Could not delete file:', error)
      }
    }

    // Supprimer l'enregistrement en base
    await prisma.pvArrondissement.delete({
      where: { code: documentId }
    })

    const response = NextResponse.json({ message: 'Document deleted successfully' })
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  } catch (error) {
    console.error('Error deleting document:', error)
    const response = NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    return response
  }
}
