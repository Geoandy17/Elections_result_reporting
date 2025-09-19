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

interface ExtendedTokenPayload {
  userId?: string;
  email?: string;
  role?: string;
  code?: number | string;
  userCode?: number | string;
  username?: string;
  user?: { username?: string };
}

type DepartmentWithRelations = {
  code: number;
  libelle: string | null;
  code_region: number | null;
  region: unknown;
  arrondissements: unknown;
  participationDepartements: unknown[];
}

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification et récupérer l'utilisateur
    const authHeader = request.headers.get('authorization');
    console.log('=== DEBUT DEBUG TOKEN ===');
    console.log('Auth header:', authHeader);
    
    const token = getTokenFromHeader(authHeader || undefined);
    console.log('Token extrait:', token ? `${token.substring(0, 20)}...` : 'null');
    
    let userUsername: string | null = null;
    let userRole: string | null = null;
    let userCode: number | null = null;
    
    if (token) {
      try {
        const decoded = verifyToken(token) as ExtendedTokenPayload;
        console.log('Token décodé avec succès');
        console.log('Structure complète du token:', JSON.stringify(decoded, null, 2));
        
        // Le token contient le code utilisateur dans 'sub' (standard JWT)
        // Le code peut être dans différents endroits selon la structure du token
        const codeFromToken = (decoded as any).sub || decoded.code || decoded.userCode || decoded.userId;
        userUsername = decoded.username || decoded.user?.username || null;
        userRole = decoded.role || null;
        
        console.log('Valeurs extraites du token:');
        console.log('- codeFromToken:', codeFromToken);
        console.log('- userUsername:', userUsername);
        console.log('- decoded.email:', decoded.email);
        console.log('- decoded.role:', decoded.role);
        
        // Récupérer l'utilisateur depuis la BD partagée
        // On peut chercher par code ou username
        let utilisateur = null;
        
        if (codeFromToken) {
          // Priorité au code si disponible
          const codeToSearch = typeof codeFromToken === 'string' ? parseInt(codeFromToken) : codeFromToken;
          console.log('Recherche utilisateur par code:', codeToSearch);
          
          utilisateur = await prisma.utilisateur.findUnique({
            where: { code: codeToSearch },
            include: { role: true }
          });
          
          if (utilisateur) {
            console.log('Utilisateur trouvé par code:', {
              code: utilisateur.code,
              username: utilisateur.username,
              role: utilisateur.role?.libelle
            });
          } else {
            console.log('Aucun utilisateur trouvé avec le code:', codeToSearch);
          }
        }
        
        if (!utilisateur && userUsername) {
          // Sinon chercher par username
          console.log('Recherche utilisateur par username:', userUsername);
          
          utilisateur = await prisma.utilisateur.findUnique({
            where: { username: userUsername },
            include: { role: true }
          });
          
          if (utilisateur) {
            console.log('Utilisateur trouvé par username:', {
              code: utilisateur.code,
              username: utilisateur.username,
              role: utilisateur.role?.libelle
            });
          } else {
            console.log('Aucun utilisateur trouvé avec le username:', userUsername);
          }
        }
        
        // Si toujours pas trouvé, essayer avec l'email si disponible
        if (!utilisateur && decoded.email) {
          console.log('Recherche utilisateur par email:', decoded.email);
          
          utilisateur = await prisma.utilisateur.findFirst({
            where: { 
              OR: [
                { email: decoded.email },
                { username: decoded.email }
              ]
            },
            include: { role: true }
          });
          
          if (utilisateur) {
            console.log('Utilisateur trouvé par email:', {
              code: utilisateur.code,
              username: utilisateur.username,
              role: utilisateur.role?.libelle
            });
          } else {
            console.log('Aucun utilisateur trouvé avec l\'email:', decoded.email);
          }
        }
        
        if (utilisateur) {
          userCode = utilisateur.code;
          userRole = utilisateur.role?.libelle || null;
          userUsername = utilisateur.username;
          
          console.log('=== UTILISATEUR FINAL ===');
          console.log('Code:', userCode);
          console.log('Username:', userUsername);
          console.log('Role:', userRole);
        } else {
          console.log('AVERTISSEMENT: Aucun utilisateur trouvé dans la base de données');
          
          // Lister quelques utilisateurs pour debug
          const sampleUsers = await prisma.utilisateur.findMany({
            take: 5,
            select: {
              code: true,
              username: true,
              email: true
            }
          });
          console.log('Exemples d\'utilisateurs dans la BD:', sampleUsers);
        }
      } catch (error) {
        console.error('Erreur lors du décodage/vérification du token:', error);
        // Token invalide mais on continue (accès public possible)
      }
    } else {
      console.log('Pas de token fourni - accès anonyme');
    }
    
    console.log('=== FIN DEBUG TOKEN ===');

    // Récupérer les query params
    const { searchParams } = new URL(request.url);
    const codeRegion = searchParams.get('region');
    // const latitude = searchParams.get('lat');
    // const longitude = searchParams.get('lng');
    // TODO: Implémenter la recherche par géolocalisation

    // Construire le filtre WHERE selon le rôle
    const whereClause: Record<string, unknown> = {};
    
    // Appliquer les restrictions selon le rôle
    if (userRole && userCode) {
      if (userRole === 'Administrateur') {
        // Admin voit tout, pas de restriction
      } else if (userRole === 'Scrutateur Departement') {
        // Scrutateur voit uniquement ses départements assignés ou ceux de sa région
        let allowedDeptCodes: number[] = [];
        
        // 1. Récupérer les départements directement assignés
        const directDepts = await prisma.utilisateurDepartement.findMany({
          where: { code_utilisateur: userCode },
          select: { code_departement: true }
        });
        
        const directCodes = directDepts
          .filter((d: { code_departement: number | null }) => d.code_departement !== null)
          .map((d: { code_departement: number | null }) => d.code_departement!);
        
        // 2. Récupérer les départements via les régions assignées
        const userRegions = await prisma.utilisateurRegion.findMany({
          where: { code_utilisateur: userCode },
          select: { code_region: true }
        });
        
        if (userRegions.length > 0) {
          const regionCodes = userRegions
            .filter((r: { code_region: number | null }) => r.code_region !== null)
            .map((r: { code_region: number | null }) => r.code_region!);
          
          const regionDepts = await prisma.departement.findMany({
            where: { code_region: { in: regionCodes } },
            select: { code: true }
          });
          
          const regionDeptCodes = regionDepts.map((d: { code: number }) => d.code);
          allowedDeptCodes = [...new Set([...directCodes, ...regionDeptCodes])];
        } else {
          allowedDeptCodes = directCodes;
        }
        
        if (allowedDeptCodes.length === 0) {
          console.log('AVERTISSEMENT: Aucun département assigné pour le scrutateur:', userUsername);
          return NextResponse.json({
            success: true,
            count: 0,
            data: [],
            message: "Aucun département assigné à cet utilisateur"
          });
        }
        
        console.log('Départements autorisés pour le scrutateur:', allowedDeptCodes);
        
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
      whereClause.code_region = parseInt(codeRegion);
    }
    
    console.log('Clause WHERE finale:', JSON.stringify(whereClause, null, 2));

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
              select: { bureauVotes: true }
            }
          }
        },
        participationDepartements: true // Inclure les participations pour vérifier le statut
      },
      orderBy: [
        { code_region: 'asc' },
        { libelle: 'asc' }
      ]
    });

    // Ajouter le statut isLocked à chaque département
    const departementsWithStatus = departements.map((dept: DepartmentWithRelations) => ({
      ...dept,
      isLocked: dept.participationDepartements && dept.participationDepartements.length > 0,
      hasResults: dept.participationDepartements && dept.participationDepartements.length > 0
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