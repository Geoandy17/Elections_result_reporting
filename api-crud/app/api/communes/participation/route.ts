import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (optionnel pour compatibilité web)
    const token = getTokenFromHeader(request.headers.get('authorization') || undefined);
    if (token) {
      try {
        verifyToken(token);
      } catch {
        // Token invalide mais on continue (pour compatibilité web)
      }
    }

    const body = await request.json();
    const {
      codeCommune,
      nombreBureaux,
      nombreInscrits,
      nombreVotants,
      tauxParticipation,   
      bulletinsNuls,
      suffragesValables,
      tauxAbstention,
      forceValidation = false
    } = body;

    // Validation des données
    if (!codeCommune) {
      return NextResponse.json(
        { error: 'Code commune requis' },
        { status: 400 }
      );
    }

    // Vérifier si la commune existe
    const commune = await prisma.arrondissement.findUnique({
      where: { code: parseInt(codeCommune) }
    });

    if (!commune) {
      return NextResponse.json(
        { error: 'Commune non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si une participation existe déjà (verrouillage)
    const existingParticipation = await prisma.participationArrondissement.findFirst({
      where: { code_arrondissement: parseInt(codeCommune) }
    });

    if (existingParticipation) {
      return NextResponse.json(
        { 
          error: 'Les données de participation pour cette commune ont déjà été soumises et ne peuvent plus être modifiées',
          isLocked: true 
        },
        { status: 403 }
      );
    }

    // Convertir les valeurs
    const inscrits = nombreInscrits ? parseInt(nombreInscrits) : 0;
    const votants = nombreVotants ? parseInt(nombreVotants) : 0;
    const nuls = bulletinsNuls ? parseInt(bulletinsNuls) : 0;
    const valables = suffragesValables ? parseInt(suffragesValables) : 0;
    const tauxPart = tauxParticipation ? parseFloat(tauxParticipation) : 0;
    const tauxAbst = tauxAbstention ? parseFloat(tauxAbstention) : 0;

    // Validation de cohérence si forceValidation n'est pas true
    if (!forceValidation) {
      const errors = [];

      // Vérifier que les votants ne dépassent pas les inscrits
      if (votants > inscrits && inscrits > 0) {
        errors.push("Le nombre de votants ne peut pas dépasser le nombre d'inscrits");
      }

      // Vérifier que bulletins nuls + suffrages valables = votants (avec tolérance)
      const totalBulletins = nuls + valables;
      if (Math.abs(totalBulletins - votants) > 5 && votants > 0) {
        errors.push(`La somme des bulletins nuls (${nuls}) et suffrages valables (${valables}) devrait être égale au nombre de votants (${votants})`);
      }

      // Vérifier la cohérence du taux de participation
      if (inscrits > 0) {
        const calculatedTaux = (votants / inscrits) * 100;
        if (Math.abs(calculatedTaux - tauxPart) > 1) {
          errors.push(`Le taux de participation saisi (${tauxPart}%) ne correspond pas au calcul (${calculatedTaux.toFixed(2)}%)`);
        }
      }

      // Vérifier la cohérence du taux d'abstention
      if (inscrits > 0) {
        const calculatedAbstention = ((inscrits - votants) / inscrits) * 100;
        if (Math.abs(calculatedAbstention - tauxAbst) > 1) {
          errors.push(`Le taux d'abstention saisi (${tauxAbst}%) ne correspond pas au calcul (${calculatedAbstention.toFixed(2)}%)`);
        }
      }

      // Vérifier que les taux sont entre 0 et 100
      if (tauxPart < 0 || tauxPart > 100) {
        errors.push("Le taux de participation doit être entre 0 et 100%");
      }

      if (tauxAbst < 0 || tauxAbst > 100) {
        errors.push("Le taux d'abstention doit être entre 0 et 100%");
      }

      // Vérifier que taux participation + taux abstention = 100
      if (Math.abs((tauxPart + tauxAbst) - 100) > 1) {
        errors.push(`La somme du taux de participation (${tauxPart}%) et du taux d'abstention (${tauxAbst}%) devrait être égale à 100%`);
      }

      if (errors.length > 0) {
        return NextResponse.json(
          { 
            error: 'Données incohérentes détectées',
            validationErrors: errors,
            requiresConfirmation: true
          },
          { status: 400 }
        );
      }
    }

    // Créer la nouvelle participation (une seule fois, pas de mise à jour)
    const result = await prisma.participationArrondissement.create({
      data: {
        code_arrondissement: parseInt(codeCommune),
        nombre_bureau_vote: nombreBureaux ? parseInt(nombreBureaux) : 0,
        nombre_inscrit: inscrits || 0,
        nombre_votant: votants || 0,
        taux_participation: tauxPart || 0,
        bulletin_nul: nuls || 0,
        suffrage_exprime: valables || 0,
        date_creation: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Participation commune sauvegardée avec succès',
      data: result
    });

  } catch (error) {
    console.error('Erreur sauvegarde participation commune:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la sauvegarde de la participation commune' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optionnel: Vérifier l'authentification
    const token = getTokenFromHeader(request.headers.get('authorization') || undefined);
    if (token) {
      try {
        verifyToken(token);
      } catch {
        // Token invalide mais on continue
      }
    }

    const { searchParams } = new URL(request.url);
    const codeCommune = searchParams.get('codeCommune');

    if (!codeCommune) {
      return NextResponse.json(
        { error: 'Code commune requis' },
        { status: 400 }
      );
    }

    // Récupérer la participation de la commune
    const participation = await prisma.participationArrondissement.findFirst({
      where: { code_arrondissement: parseInt(codeCommune) },
      include: {
        arrondissement: true
      }
    });

    // Une commune est verrouillée si elle a des données de participation
    const isLocked = participation !== null;

    return NextResponse.json({
      success: true,
      data: participation,
      isLocked
    });

  } catch (error) {
    console.error('Erreur récupération participation commune:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la participation commune' },
      { status: 500 }
    );
  }
}