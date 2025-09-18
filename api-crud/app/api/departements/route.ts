// import { NextRequest, NextResponse } from 'next/server'
// import { prisma } from '@/lib/prisma'

// // Handle CORS preflight requests
// export async function OPTIONS() {
//   return new NextResponse(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   })
// }

// // GET /api/departements - Get all departments (helper endpoint for dropdowns)
// export async function GET() {
//   try {
//     const departements = await prisma.departement.findMany({
//       select: {
//         code: true,
//         libelle: true,
//         abbreviation: true,
//         chef_lieu: true,
//         region: {
//           select: {
//             code: true,
//             libelle: true,
//             abbreviation: true
//           }
//         }
//       },
//       orderBy: {
//         libelle: 'asc'
//       }
//     })

//     const response = NextResponse.json(departements)
//     response.headers.set('Access-Control-Allow-Origin', '*')
//     return response
//   } catch (error) {
//     console.error('Error fetching departments:', error)
//     const response = NextResponse.json(
//       { error: 'Failed to fetch departments' },
//       { status: 500 }
//     )
//     response.headers.set('Access-Control-Allow-Origin', '*')
//     return response
//   }
// }

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et récupérer l'utilisateur
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || undefined);
    let userUsername: string | null = null;
    let userRole: string | null = null;
    let userCode: number | null = null;
    
    if (token) {
      try {
        const decoded = verifyToken(token) as any;
        // Le token contient le code utilisateur (depuis l'autre backend d'auth)
        // Le code peut être dans différents endroits selon la structure du token
        const codeFromToken = decoded.code || decoded.userCode || decoded.userId;
        userUsername = decoded.username || decoded.user?.username;
        
        // Récupérer l'utilisateur depuis la BD partagée
        // On peut chercher par code ou username
        let utilisateur = null;
        
        if (codeFromToken) {
          // Priorité au code si disponible
          utilisateur = await prisma.utilisateur.findUnique({
            where: { code: parseInt(codeFromToken) },
            include: { role: true }
          });
        } else if (userUsername) {
          // Sinon chercher par username
          utilisateur = await prisma.utilisateur.findUnique({
            where: { username: userUsername },
            include: { role: true }
          });
        }
        
        if (utilisateur) {
          userCode = utilisateur.code;
          userRole = utilisateur.role?.libelle || null;
          userUsername = utilisateur.username;
        }
      } catch {
        // Token invalide mais on continue (accès public possible)
      }
    }

    // Récupérer les query params
    const { searchParams } = new URL(request.url);
    const codeRegion = searchParams.get('region');
    // const latitude = searchParams.get('lat');
    // const longitude = searchParams.get('lng');
    // TODO: Implémenter la recherche par géolocalisation

    // Construire le filtre WHERE selon le rôle
    let whereClause: any = {};
    
    // Appliquer les restrictions selon le rôle
    if (userRole && userCode) {
      if (userRole === 'Administrateur') {
        // Admin voit tout, pas de restriction
      } else if (userRole === 'Scrutateur') {
        // Scrutateur voit uniquement ses départements assignés ou ceux de sa région
        let allowedDeptCodes: number[] = [];
        
        // 1. Récupérer les départements directement assignés
        const directDepts = await prisma.utilisateurDepartement.findMany({
          where: { codeUtilisateur: userCode },
          select: { codeDepartement: true }
        });
        
        const directCodes = directDepts
          .filter(d => d.codeDepartement !== null)
          .map(d => d.codeDepartement!);
        
        // 2. Récupérer les départements via les régions assignées
        const userRegions = await prisma.utilisateurRegion.findMany({
          where: { codeUtilisateur: userCode },
          select: { codeRegion: true }
        });
        
        if (userRegions.length > 0) {
          const regionCodes = userRegions
            .filter(r => r.codeRegion !== null)
            .map(r => r.codeRegion!);
          
          const regionDepts = await prisma.departement.findMany({
            where: { codeRegion: { in: regionCodes } },
            select: { code: true }
          });
          
          const regionDeptCodes = regionDepts.map(d => d.code);
          allowedDeptCodes = [...new Set([...directCodes, ...regionDeptCodes])];
        } else {
          allowedDeptCodes = directCodes;
        }
        
        if (allowedDeptCodes.length === 0) {
          return NextResponse.json({
            success: true,
            count: 0,
            data: [],
            message: "Aucun département assigné à cet utilisateur"
          });
        }
        
        whereClause.code = { in: allowedDeptCodes };
      } else {
        // Autre rôle non autorisé
        return NextResponse.json(
          { error: `Le rôle ${userRole} n'est pas autorisé à voir les départements` },
          { status: 403 }
        );
      }
    }
    
    // Ajouter le filtre par région si spécifié
    if (codeRegion) {
      whereClause.codeRegion = parseInt(codeRegion);
    }

    // Récupérer les départements avec le filtre construit
    const departements = await prisma.departement.findMany({
      where: whereClause,
      include: {
        region: true,
        arrondissements: {
          select: {
            code: true,
            libelle: true,
            _count: {
              select: { bureauxVote: true }
            }
          }
        },
        participations: true // Inclure les participations pour vérifier le statut
      },
      orderBy: [
        { codeRegion: 'asc' },
        { libelle: 'asc' }
      ]
    });

    // Ajouter le statut isLocked à chaque département
    const departementsWithStatus = departements.map(dept => ({
      ...dept,
      isLocked: dept.participations && dept.participations.length > 0,
      hasResults: dept.participations && dept.participations.length > 0
    }));

    return NextResponse.json({
      success: true,
      count: departementsWithStatus.length,
      data: departementsWithStatus
    });

  } catch (error) {
    console.error('Erreur récupération départements:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des départements' },
      { status: 500 }
    );
  }
}