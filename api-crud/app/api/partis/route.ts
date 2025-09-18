import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Optionnel: Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? getTokenFromHeader(authHeader) : undefined;
    if (token) {
      try {
        verifyToken(token);
      } catch {
        // Token invalide mais on continue (accès public possible)
      }
    }

    // Récupérer tous les partis politiques
    const partis = await prisma.partiPolitique.findMany({
      orderBy: {
        code: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: partis,
    });

  } catch (error) {
    console.error('Erreur récupération partis:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des partis' },
      { status: 500 }
    );
  }
}