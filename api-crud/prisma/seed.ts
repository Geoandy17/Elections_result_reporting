// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with election data...');

  // Clear existing data
  await prisma.redressementCandidat.deleteMany();
  await prisma.redressementBureauVote.deleteMany();
  await prisma.resultatDepartement.deleteMany();
  await prisma.participationDepartement.deleteMany();
  await prisma.utilisateurDepartement.deleteMany();
  await prisma.bureauVote.deleteMany();
  await prisma.arrondissement.deleteMany();
  await prisma.partiPolitique.deleteMany();
  await prisma.candidat.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.departement.deleteMany();
  await prisma.region.deleteMany();
  await prisma.role.deleteMany();

  // Insert Regions
  console.log('📍 Creating regions...');
  const regions = await Promise.all([
    prisma.region.create({
      data: {
        abbreviation: 'AD',
        libelle: 'Adamaoua',
        chef_lieu: 'Ngaoundéré',
        description: 'Région de l\'Adamaoua',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.region.create({
      data: {
        abbreviation: 'CE',
        libelle: 'Centre',
        chef_lieu: 'Yaoundé',
        description: 'Région du Centre',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.region.create({
      data: {
        abbreviation: 'LT',
        libelle: 'Littoral',
        chef_lieu: 'Douala',
        description: 'Région du Littoral',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.region.create({
      data: {
        abbreviation: 'SW',
        libelle: 'Sud-Ouest',
        chef_lieu: 'Buea',
        description: 'Région du Sud-Ouest',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    })
  ]);

  // Insert Departments
  console.log('🏛️ Creating departments...');
  const departments = await Promise.all([
    prisma.departement.create({
      data: {
        abbreviation: 'WOU',
        chef_lieu: 'Douala',
        libelle: 'Wouri',
        description: 'Département du Wouri',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        code_region: regions[2].code // Littoral
      }
    }),
    prisma.departement.create({
      data: {
        abbreviation: 'MFO',
        chef_lieu: 'Yaoundé',
        libelle: 'Mfoundi',
        description: 'Département de la Mfoundi',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        code_region: regions[1].code // Centre
      }
    }),
    prisma.departement.create({
      data: {
        abbreviation: 'FAK',
        chef_lieu: 'Limbe',
        libelle: 'Fako',
        description: 'Département du Fako',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        code_region: regions[3].code // Sud-Ouest
      }
    })
  ]);

  // Insert Arrondissements
  console.log('🗺️ Creating arrondissements...');
  const arrondissements = await Promise.all([
    // Wouri arrondissements
    prisma.arrondissement.create({
      data: {
        code_departement: departments[0].code,
        code_region: regions[2].code,
        abbreviation: 'DA1',
        libelle: 'Douala 1er',
        description: 'Arrondissement de Douala 1er',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.arrondissement.create({
      data: {
        code_departement: departments[0].code,
        code_region: regions[2].code,
        abbreviation: 'DA2',
        libelle: 'Douala 2ème',
        description: 'Arrondissement de Douala 2ème',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    // Mfoundi arrondissements
    prisma.arrondissement.create({
      data: {
        code_departement: departments[1].code,
        code_region: regions[1].code,
        abbreviation: 'YA1',
        libelle: 'Yaoundé 1er',
        description: 'Arrondissement de Yaoundé 1er',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.arrondissement.create({
      data: {
        code_departement: departments[1].code,
        code_region: regions[1].code,
        abbreviation: 'YA2',
        libelle: 'Yaoundé 2ème',
        description: 'Arrondissement de Yaoundé 2ème',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    })
  ]);

  // Insert Bureau de Vote
  console.log('🗳️ Creating voting bureaus...');
  const bureaux = await Promise.all([
    prisma.bureauVote.create({
      data: {
        designation: 'Bureau de Vote Akwa Nord',
        description: 'École Publique Akwa Nord',
        latitude: 4.0511,
        longitude: 9.7679,
        altitude: 13,
        data_filled: 1,
        code_arrondissement: arrondissements[0].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        data_incoherent: 0,
        effectif: 450
      }
    }),
    prisma.bureauVote.create({
      data: {
        designation: 'Bureau de Vote Bonanjo',
        description: 'École Publique Bonanjo',
        latitude: 4.0483,
        longitude: 9.7542,
        altitude: 15,
        data_filled: 1,
        code_arrondissement: arrondissements[0].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        data_incoherent: 0,
        effectif: 520
      }
    }),
    prisma.bureauVote.create({
      data: {
        designation: 'Bureau de Vote Centre Ville',
        description: 'École Publique Centre Ville',
        latitude: 3.8667,
        longitude: 11.5167,
        altitude: 760,
        data_filled: 1,
        code_arrondissement: arrondissements[2].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        data_incoherent: 0,
        effectif: 420
      }
    })
  ]);

  // Insert Roles
  console.log('👥 Creating roles...');
  const roles = await Promise.all([
    prisma.role.create({
      data: { libelle: 'Administrateur Système' }
    }),
    prisma.role.create({
      data: { libelle: 'Coordinateur Régional' }
    }),
    prisma.role.create({
      data: { libelle: 'Superviseur Départemental' }
    }),
    prisma.role.create({
      data: { libelle: 'Opérateur de Saisie' }
    })
  ]);

  // Insert Candidates
  console.log('🎯 Creating candidates...');
  const candidates = await Promise.all([
    prisma.candidat.create({
      data: {
        noms_prenoms: 'Paul BIYA',
        photo: '/images/candidates/biya.jpg',
        date_creation: new Date().toISOString(),
        code_createur: 'SYSTEM'
      }
    }),
    prisma.candidat.create({
      data: {
        noms_prenoms: 'Maurice KAMTO',
        photo: '/images/candidates/kamto.jpg',
        date_creation: new Date().toISOString(),
        code_createur: 'SYSTEM'
      }
    }),
    prisma.candidat.create({
      data: {
        noms_prenoms: 'Cabral LIBII',
        photo: '/images/candidates/libii.jpg',
        date_creation: new Date().toISOString(),
        code_createur: 'SYSTEM'
      }
    })
  ]);

  // Insert Political Parties
  console.log('🏛️ Creating political parties...');
  const parties = await Promise.all([
    prisma.partiPolitique.create({
      data: {
        designation: 'Rassemblement Démocratique du Peuple Camerounais',
        abbreviation: 'RDPC',
        description: 'Parti au pouvoir depuis 1985',
        coloration_bulletin: 'Vert',
        image: '/images/parties/rdpc.png',
        code_candidat: candidates[0].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.partiPolitique.create({
      data: {
        designation: 'Mouvement pour la Renaissance du Cameroun',
        abbreviation: 'MRC',
        description: 'Principal parti d\'opposition',
        coloration_bulletin: 'Blanc',
        image: '/images/parties/mrc.png',
        code_candidat: candidates[1].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    }),
    prisma.partiPolitique.create({
      data: {
        designation: 'Parti Camerounais pour la Réconciliation Nationale',
        abbreviation: 'PCRN',
        description: 'Parti de la réconciliation',
        coloration_bulletin: 'Jaune',
        image: '/images/parties/pcrn.png',
        code_candidat: candidates[2].code,
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString()
      }
    })
  ]);

  // Insert Users
  console.log('👤 Creating users...');
  const users = await Promise.all([
    prisma.utilisateur.create({
      data: {
        noms_prenoms: 'Administrateur Système',
        email: 'admin@elections.cm',
        password: '$2b$10$hash', // In real app, hash properly
        username: 'admin',
        code_role: roles[0].code,
        boite_postale: 'BP 1001',
        adresse: 'Yaoundé',
        contact: '+237 677 123 456',
        code_createur: 'SYSTEM',
        date_creation: new Date().toISOString(),
        statut_vie: 1
      }
    }),
    prisma.utilisateur.create({
      data: {
        noms_prenoms: 'Jean MBALLA',
        email: 'jean.mballa@elections.cm',
        password: '$2b$10$hash',
        username: 'jmballa',
        code_role: roles[2].code,
        boite_postale: 'BP 1002',
        adresse: 'Douala',
        contact: '+237 677 234 567',
        code_createur: 'admin',
        date_creation: new Date().toISOString(),
        statut_vie: 1
      }
    }),
    prisma.utilisateur.create({
      data: {
        noms_prenoms: 'Marie NGONO',
        email: 'marie.ngono@elections.cm',
        password: '$2b$10$hash',
        username: 'mngono',
        code_role: roles[2].code,
        boite_postale: 'BP 1003',
        adresse: 'Yaoundé',
        contact: '+237 677 345 678',
        code_createur: 'admin',
        date_creation: new Date().toISOString(),
        statut_vie: 1
      }
    })
  ]);

  // Insert User Department Assignments
  console.log('🔗 Creating user assignments...');
  await Promise.all([
    prisma.utilisateurDepartement.create({
      data: {
        code_departement: departments[0].code, // Wouri
        code_utilisateur: users[1].code // Jean MBALLA
      }
    }),
    prisma.utilisateurDepartement.create({
      data: {
        code_departement: departments[1].code, // Mfoundi
        code_utilisateur: users[2].code // Marie NGONO
      }
    })
  ]);

  // Insert Participation Data
  console.log('📊 Creating participation data...');
  await Promise.all([
    prisma.participationDepartement.create({
      data: {
        code_departement: departments[0].code,
        nombre_bureau_vote: 125,
        nombre_inscrit: 450000,
        nombre_enveloppe_urnes: 285000,
        nombre_enveloppe_bulletins_differents: 1250,
        nombre_bulletin_electeur_identifiable: 850,
        nombre_bulletin_enveloppes_signes: 950,
        nombre_enveloppe_non_elecam: 450,
        nombre_bulletin_non_elecam: 320,
        nombre_bulletin_sans_enveloppe: 180,
        enveloppesVides: 220,
        nombreVotant: 285000,
        bulletinNul: 5500,
        suffrageExprime: 279500,
        tauxParticipation: 63.33,
        date_creation: new Date().toISOString()
      }
    }),
    prisma.participationDepartement.create({
      data: {
        code_departement: departments[1].code,
        nombre_bureau_vote: 98,
        nombre_inscrit: 380000,
        nombre_enveloppe_urnes: 245000,
        nombre_enveloppe_bulletins_differents: 980,
        nombre_bulletin_electeur_identifiable: 720,
        nombre_bulletin_enveloppes_signes: 810,
        nombre_enveloppe_non_elecam: 380,
        nombre_bulletin_non_elecam: 290,
        nombre_bulletin_sans_enveloppe: 150,
        enveloppesVides: 190,
        nombreVotant: 245000,
        bulletinNul: 3800,
        suffrageExprime: 241200,
        tauxParticipation: 64.47,
        date_creation: new Date().toISOString()
      }
    })
  ]);

  // Insert Election Results
  console.log('🎯 Creating election results...');
  const results = [];
  
  // Wouri results
  for (let i = 0; i < parties.length; i++) {
    const votes = [165000, 75000, 25000][i] || 5000;
    const percentage = [59.05, 26.83, 8.94][i] || 1.79;
    
    results.push(
      prisma.resultatDepartement.create({
        data: {
          code_departement: departments[0].code,
          codeParti: parties[i].code,
          nombreVote: votes,
          pourcentage: percentage,
          date_creation: new Date().toISOString()
        }
      })
    );
  }
  
  // Mfoundi results
  for (let i = 0; i < parties.length; i++) {
    const votes = [120000, 85000, 22000][i] || 4000;
    const percentage = [49.75, 35.23, 9.12][i] || 1.66;
    
    results.push(
      prisma.resultatDepartement.create({
        data: {
          code_departement: departments[1].code,
          codeParti: parties[i].code,
          nombreVote: votes,
          pourcentage: percentage,
          date_creation: new Date().toISOString()
        }
      })
    );
  }
  
  await Promise.all(results);

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • ${regions.length} regions created`);
  console.log(`   • ${departments.length} departments created`);
  console.log(`   • ${arrondissements.length} arrondissements created`);
  console.log(`   • ${bureaux.length} voting bureaus created`);
  console.log(`   • ${candidates.length} candidates created`);
  console.log(`   • ${parties.length} political parties created`);
  console.log(`   • ${users.length} users created`);
  console.log(`   • ${roles.length} roles created`);
  console.log('');
  console.log('🔑 Demo Login Credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
  console.log('');
  console.log('   Username: jmballa');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });