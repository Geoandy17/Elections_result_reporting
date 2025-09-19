import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Optionnel: Vérifier l'authentification
    const authHeader = request.headers.get('authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;
    // Variable userId déclarée mais non utilisée - à supprimer ou utiliser
    // let userId: string | undefined;
    
    if (token) {
      try {
        verifyToken(token);
        // const decoded = verifyToken(token);
        // userId = decoded.userId;
      } catch {
        // Token invalide mais on continue (accès public possible)
        console.warn('Token invalide lors de la soumission');
      }
    }

    const body = await request.json();
    const { participation, resultats } = body;

    if (!participation || !resultats) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const codeDepartement = participation.codeDepartement;

    // Vérifier si des données de participation ont été saisies
    const hasParticipationData = participation.nombreInscrit > 0 || 
                                 participation.nombreVotant > 0 || 
                                 participation.nombreBureauVote > 0;
    
    // Validation uniquement si des données de participation sont fournies
    if (hasParticipationData) {
      if (participation.nombreInscrit <= 0) {
        return NextResponse.json(
          { error: 'Si vous saisissez la participation, le nombre d\'inscrits doit être supérieur à 0' },
          { status: 400 }
        );
      }

      if (participation.nombreVotant < 0) {
        return NextResponse.json(
          { error: 'Le nombre de votants ne peut pas être négatif' },
          { status: 400 }
        );
      }

      if (participation.nombreVotant > participation.nombreInscrit) {
        return NextResponse.json(
          { error: 'Le nombre de votants ne peut pas dépasser le nombre d\'inscrits' },
          { status: 400 }
        );
      }
    }

    // Calcul du suffrage exprimé (0 si pas de participation)
    const suffrageExprime = participation.suffrageExprime || 
      (participation.nombreVotant - (participation.bulletinNul || 0)) || 0;

    // Calcul du taux de participation
    const tauxParticipation = participation.nombreInscrit > 0 
      ? parseFloat(((participation.nombreVotant / participation.nombreInscrit) * 100).toFixed(2))
      : null;

    // Vérifier si le département n'a pas déjà été soumis
    const existingParticipation = await prisma.participationDepartement.findUnique({
      where: {
        code_departement: codeDepartement,
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Ce département a déjà été soumis et ne peut plus être modifié' },
        { status: 400 }
      );
    }

    // Transaction pour créer la participation et les résultats
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      // Créer la participation avec tous les champs
      const participationCreated = await tx.participationDepartement.create({
        data: {
          code_departement: participation.codeDepartement,
          // Champs principaux obligatoires
          nombre_bureau_vote: participation.nombreBureauVote || 0,
          nombre_inscrit: participation.nombreInscrit || 0,
          nombre_votant: participation.nombreVotant || 0,
          bulletin_nul: participation.bulletinNul || 0,
          suffrage_exprime: suffrageExprime,
          
          // Champs détaillés optionnels
          nombre_enveloppe_urnes: participation.nombreEnveloppeUrnes || 0,
          nombre_enveloppe_bulletins_differents: participation.enveloppesContBulletinsDifferents || 0,
          nombre_bulletin_electeur_identifiable: participation.bulletinsAvecSignes || 0,
          nombre_bulletin_enveloppes_signes: participation.bulletinsDansEnveloppesAvecSignes || 0,
          nombre_enveloppe_non_elecam: participation.enveloppesAutresQueElecam || 0,
          nombre_bulletin_non_elecam: participation.bulletinsAutresQueElecam || 0,
          nombre_bulletin_sans_enveloppe: participation.bulletinsSansEnveloppes || 0,
          nombre_enveloppe_vide: participation.enveloppesVides || 0,
          
          // Taux de participation calculé
          taux_participation: tauxParticipation,
          
          date_creation: new Date().toISOString(),
        },
      });

      // Créer les résultats pour chaque candidat
      const resultatsCreated = await Promise.all(
        resultats.map(async (resultat: { codeParti?: number; codeCandidat?: number; codeDepartement: number; nombreVote?: number; pourcentage?: number }) => {
          // Récupérer le parti du candidat si non fourni
          let codeParti = resultat.codeParti;
          
          if (!codeParti && resultat.codeCandidat) {
            const candidat = await tx.candidat.findUnique({
              where: { code: resultat.codeCandidat },
              include: { partiPolitiques: true }
            });
            
            if (candidat && candidat.partiPolitiques.length > 0) {
              codeParti = candidat.partiPolitiques[0].code;
            }
          }
          
          return tx.resultatDepartement.create({
            data: {
              code_departement: resultat.codeDepartement,
              code_candidat: resultat.codeCandidat,
              code_parti: codeParti || 1, // Parti par défaut si non trouvé
              nombre_vote: resultat.nombreVote || 0,
              pourcentage: resultat.pourcentage || 0,
            },
          });
        })
      );

      // Créer un enregistrement d'audit (optionnel)
      // Vous pourriez vouloir enregistrer qui a soumis les résultats et quand
      
      return {
        participation: participationCreated,
        resultats: resultatsCreated,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Résultats soumis avec succès',
      data: result,
    });

  } catch (error) {
    console.error('Erreur soumission résultats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission des résultats' },
      { status: 500 }
    );
  }
}