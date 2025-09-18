import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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

    const resolvedParams = await params;
    const codeDepartement = parseInt(resolvedParams.code);

    // Récupérer les données de participation existantes
    const participation = await prisma.participationDepartement.findUnique({
      where: {
        codeDepartement,
      },
    });

    // Récupérer les résultats existants
    const resultats = await prisma.resultatDepartement.findMany({
      where: {
        codeDepartement,
      },
      include: {
        parti: true,
      },
    });

    // Un département est considéré comme verrouillé s'il a des données de participation
    const isLocked = participation !== null;

    return NextResponse.json({
      success: true,
      data: {
        isLocked,
        participation,
        resultats,
      },
    });

  } catch (error) {
    console.error('Erreur vérification statut département:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du statut' },
      { status: 500 }
    );
  }
}