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

    // 1. Récupérer les données de participation du département
    const participation = await prisma.participationDepartement.findUnique({
      where: {
        code_departement: codeDepartement,
      },
    });

    // 2. Récupérer les résultats du département avec candidats et partis
    const resultats = await prisma.resultatDepartement.findMany({
      where: {
        code_departement: codeDepartement,
      },
      include: {
        parti: true,
      },
      orderBy: {
        nombre_vote: 'desc', // Trier par nombre de voix décroissant
      },
    });

    // 3. Récupérer le département avec ses arrondissements (communes)
    const departement = await prisma.departement.findUnique({
      where: {
        code: codeDepartement,
      },
      include: {
        arrondissements: {
          select: {
            code: true,
            libelle: true,
            description: true,
          },
        },
        region: {
          select: {
            code: true,
            libelle: true,
          },
        },
      },
    });

    // 4. Récupérer les participations des communes (arrondissements)
    const participationsCommunes = await prisma.participationArrondissement.findMany({
      where: {
        arrondissement: {
          code_departement: codeDepartement,
        },
      },
      include: {
        arrondissement: {
          select: {
            code: true,
            libelle: true,
          },
        },
      },
    });

    // 5. Organiser les données des communes
    const communesData: Record<string, unknown> = {};
    participationsCommunes.forEach((participation: (typeof participationsCommunes)[number]) => {
      const codeCommune = participation.arrondissement?.code;
      if (codeCommune) {
        communesData[codeCommune.toString()] = {
          code: codeCommune,
          libelle: participation.arrondissement?.libelle,
          participation: {
            // Champs principaux
            nombre_bureau_vote: participation.nombre_bureau_vote,
            nombre_inscrit: participation.nombre_inscrit,
            nombre_votant: participation.nombre_votant,
            bulletin_nul: participation.bulletin_nul,
            suffrage_exprime: participation.suffrage_exprime,
            
            // Champs détaillés des enveloppes et bulletins
            nombre_enveloppe_urnes: participation.nombre_enveloppe_urnes,
            nombre_enveloppe_bulletins_differents: participation.nombre_enveloppe_bulletins_differents,
            nombre_bulletin_electeur_identifiable: participation.nombre_bulletin_electeur_identifiable,
            nombre_bulletin_enveloppes_signes: participation.nombre_bulletin_enveloppes_signes,
            nombre_enveloppe_non_elecam: participation.nombre_enveloppe_non_elecam,
            nombre_bulletin_non_elecam: participation.nombre_bulletin_non_elecam,
            nombre_bulletin_sans_enveloppe: participation.nombre_bulletin_sans_enveloppe,
            nombre_enveloppe_vide: participation.nombre_enveloppe_vide,
            nombre_suffrages_valable: participation.nombre_suffrages_valable,
            
            // Taux calculés
            taux_participation: participation.taux_participation,
            taux_abstention: participation.taux_abstention,
            
            // Métadonnées
            date_soumission: participation.date_creation,
          },
        };
      }
    });

    // 6. Calculer les statistiques globales
    const stats = {
      totalCommunes: departement?.arrondissements?.length || 0,
      communesAvecDonnees: Object.keys(communesData).length,
      pourcentageCompletude: departement?.arrondissements?.length 
        ? (Object.keys(communesData).length / departement.arrondissements.length * 100).toFixed(1)
        : 0,
    };

    const response = {
      success: true,
      data: {
        departement: {
          code: codeDepartement,
          libelle: departement?.libelle,
          region: departement?.region,
          arrondissements: departement?.arrondissements || [],
        },
        participation: participation,
        resultats: resultats,
        communesData: communesData,
        stats: stats,
        isLocked: participation !== null, // Département verrouillé s'il a des données
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur récupération récapitulatif département:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération du récapitulatif du département' 
      },
      { status: 500 }
    );
  }
}