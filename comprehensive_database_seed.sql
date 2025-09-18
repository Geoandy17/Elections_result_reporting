-- =====================================================
-- COMPREHENSIVE DATABASE SEEDING SCRIPT
-- Election Result Reporting System
-- =====================================================
-- This script seeds all tables with realistic data covering various scenarios
-- for testing and demonstration purposes.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. CLEAR EXISTING DATA (in correct order)
-- =====================================================

-- Clear dependent tables first
DELETE FROM synthese_arrondissement;
DELETE FROM synthese_bureau_vote;
DELETE FROM synthese_departement;
DELETE FROM synthese_region;
DELETE FROM resultat;
DELETE FROM participation;
DELETE FROM proces_verbaux;
DELETE FROM pv_arrondissement;
DELETE FROM redressement_bureau_vote;
DELETE FROM redressement_candidat;
DELETE FROM resultat_departement;
DELETE FROM participation_departement;
DELETE FROM membre_commission;
DELETE FROM commission_departementale;
DELETE FROM utilisateur_affectation_territoriale;
DELETE FROM utilisateur_arrondissement;
DELETE FROM utilisateur_bureau_vote;
DELETE FROM utilisateur_departement;
DELETE FROM utilisateur_region;
DELETE FROM role_permission;
DELETE FROM journal;

-- Clear main tables
DELETE FROM utilisateur;
DELETE FROM bureau_vote;
DELETE FROM arrondissement;
DELETE FROM departement;
DELETE FROM region;
DELETE FROM candidat;
DELETE FROM parti_politique;
DELETE FROM role;
DELETE FROM permission;
DELETE FROM fonction_commission;

-- Reset auto-increment counters
ALTER TABLE region AUTO_INCREMENT = 1;
ALTER TABLE departement AUTO_INCREMENT = 1;
ALTER TABLE arrondissement AUTO_INCREMENT = 1;
ALTER TABLE bureau_vote AUTO_INCREMENT = 1;
ALTER TABLE candidat AUTO_INCREMENT = 1;
ALTER TABLE parti_politique AUTO_INCREMENT = 1;
ALTER TABLE role AUTO_INCREMENT = 1;
ALTER TABLE permission AUTO_INCREMENT = 1;
ALTER TABLE utilisateur AUTO_INCREMENT = 1;
ALTER TABLE commission_departementale AUTO_INCREMENT = 1;
ALTER TABLE fonction_commission AUTO_INCREMENT = 1;
ALTER TABLE membre_commission AUTO_INCREMENT = 1;
ALTER TABLE participation_departement AUTO_INCREMENT = 1;
ALTER TABLE resultat_departement AUTO_INCREMENT = 1;
ALTER TABLE redressement_candidat AUTO_INCREMENT = 1;
ALTER TABLE redressement_bureau_vote AUTO_INCREMENT = 1;
ALTER TABLE synthese_arrondissement AUTO_INCREMENT = 1;
ALTER TABLE synthese_bureau_vote AUTO_INCREMENT = 1;
ALTER TABLE synthese_departement AUTO_INCREMENT = 1;
ALTER TABLE synthese_region AUTO_INCREMENT = 1;
ALTER TABLE resultat AUTO_INCREMENT = 1;
ALTER TABLE participation AUTO_INCREMENT = 1;
ALTER TABLE proces_verbaux AUTO_INCREMENT = 1;
ALTER TABLE pv_arrondissement AUTO_INCREMENT = 1;
ALTER TABLE journal AUTO_INCREMENT = 1;

-- =====================================================
-- 2. SEED REFERENCE DATA
-- =====================================================

-- Insert Regions (10 regions of Cameroon)
INSERT INTO region (code, abbreviation, libelle, chef_lieu, description, code_createur, code_modificateur, date_creation, date_modification) VALUES
(1, 'ADM', 'Adamaoua', 'Ngaoundéré', 'Région de l\'Adamaoua', '1', '1', NOW(), NOW()),
(2, 'CEN', 'Centre', 'Yaoundé', 'Région du Centre', '1', '1', NOW(), NOW()),
(3, 'EST', 'Est', 'Bertoua', 'Région de l\'Est', '1', '1', NOW(), NOW()),
(4, 'EXT', 'Extrême-Nord', 'Maroua', 'Région de l\'Extrême-Nord', '1', '1', NOW(), NOW()),
(5, 'LIT', 'Littoral', 'Douala', 'Région du Littoral', '1', '1', NOW(), NOW()),
(6, 'NORD', 'Nord', 'Garoua', 'Région du Nord', '1', '1', NOW(), NOW()),
(7, 'NOU', 'Nord-Ouest', 'Bamenda', 'Région du Nord-Ouest', '1', '1', NOW(), NOW()),
(8, 'OUES', 'Ouest', 'Bafoussam', 'Région de l\'Ouest', '1', '1', NOW(), NOW()),
(9, 'SUD', 'Sud', 'Ebolowa', 'Région du Sud', '1', '1', NOW(), NOW()),
(10, 'SUDO', 'Sud-Ouest', 'Buéa', 'Région du Sud-Ouest', '1', '1', NOW(), NOW());

-- Insert Departments (58 departments of Cameroon)
INSERT INTO departement (code, abbreviation, chef_lieu, libelle, description, code_createur, code_modificateur, date_creation, date_modification, code_region) VALUES
-- Adamaoua (5 departments)
(1, 'VIN', 'Vina', 'Vina', 'Département de la Vina', '1', '1', NOW(), NOW(), 1),
(2, 'DJA', 'Djérem', 'Djérem', 'Département du Djérem', '1', '1', NOW(), NOW(), 1),
(3, 'FAR', 'Faro', 'Faro', 'Département du Faro', '1', '1', NOW(), NOW(), 1),
(4, 'MAYO', 'Mayo-Banyo', 'Mayo-Banyo', 'Département du Mayo-Banyo', '1', '1', NOW(), NOW(), 1),
(5, 'MBE', 'Mbéré', 'Mbéré', 'Département du Mbéré', '1', '1', NOW(), NOW(), 1),

-- Centre (7 departments)
(6, 'MFOU', 'Mfoundi', 'Mfoundi', 'Département de Mfoundi', '1', '1', NOW(), NOW(), 2),
(7, 'NYO', 'Nyong-et-So\'o', 'Nyong-et-So\'o', 'Département du Nyong-et-So\'o', '1', '1', NOW(), NOW(), 2),
(8, 'MEF', 'Méfou-et-Afamba', 'Méfou-et-Afamba', 'Département de Méfou-et-Afamba', '1', '1', NOW(), NOW(), 2),
(9, 'MFO', 'Méfou-et-Akono', 'Méfou-et-Akono', 'Département de Méfou-et-Akono', '1', '1', NOW(), NOW(), 2),
(10, 'MFA', 'Mfoundi', 'Mfoundi', 'Département de Mfoundi', '1', '1', NOW(), NOW(), 2),
(11, 'LEK', 'Lekié', 'Lekié', 'Département de la Lekié', '1', '1', NOW(), NOW(), 2),
(12, 'HAU', 'Haute-Sanaga', 'Haute-Sanaga', 'Département de la Haute-Sanaga', '1', '1', NOW(), NOW(), 2),

-- Littoral (4 departments)
(13, 'WOU', 'Wouri', 'Wouri', 'Département du Wouri', '1', '1', NOW(), NOW(), 5),
(14, 'SAN', 'Sanaga-Maritime', 'Sanaga-Maritime', 'Département de la Sanaga-Maritime', '1', '1', NOW(), NOW(), 5),
(15, 'MUN', 'Mungo', 'Mungo', 'Département du Mungo', '1', '1', NOW(), NOW(), 5),
(16, 'NKA', 'Nkam', 'Nkam', 'Département du Nkam', '1', '1', NOW(), NOW(), 5),

-- Nord-Ouest (7 departments)
(17, 'BUI', 'Bui', 'Bui', 'Département du Bui', '1', '1', NOW(), NOW(), 7),
(18, 'DON', 'Donga-Mantung', 'Donga-Mantung', 'Département de la Donga-Mantung', '1', '1', NOW(), NOW(), 7),
(19, 'MEN', 'Menchum', 'Menchum', 'Département du Menchum', '1', '1', NOW(), NOW(), 7),
(20, 'MEZ', 'Mezam', 'Mezam', 'Département du Mezam', '1', '1', NOW(), NOW(), 7),
(21, 'MOM', 'Momo', 'Momo', 'Département du Momo', '1', '1', NOW(), NOW(), 7),
(22, 'NGI', 'Ngo-Ketunjia', 'Ngo-Ketunjia', 'Département du Ngo-Ketunjia', '1', '1', NOW(), NOW(), 7),
(23, 'NON', 'Noni', 'Noni', 'Département du Noni', '1', '1', NOW(), NOW(), 7),

-- Ouest (8 departments)
(24, 'BAM', 'Bamboutos', 'Bamboutos', 'Département des Bamboutos', '1', '1', NOW(), NOW(), 8),
(25, 'HAU', 'Hauts-Plateaux', 'Hauts-Plateaux', 'Département des Hauts-Plateaux', '1', '1', NOW(), NOW(), 8),
(26, 'KOU', 'Koung-Khi', 'Koung-Khi', 'Département du Koung-Khi', '1', '1', NOW(), NOW(), 8),
(27, 'MEN', 'Ménoua', 'Ménoua', 'Département de la Ménoua', '1', '1', NOW(), NOW(), 8),
(28, 'MIF', 'Mifi', 'Mifi', 'Département de la Mifi', '1', '1', NOW(), NOW(), 8),
(29, 'NDE', 'Ndé', 'Ndé', 'Département du Ndé', '1', '1', NOW(), NOW(), 8),
(30, 'NOU', 'Noun', 'Noun', 'Département du Noun', '1', '1', NOW(), NOW(), 8),
(31, 'KOU', 'Koung-Khi', 'Koung-Khi', 'Département du Koung-Khi', '1', '1', NOW(), NOW(), 8),

-- Sud-Ouest (6 departments)
(32, 'FAK', 'Fako', 'Fako', 'Département du Fako', '1', '1', NOW(), NOW(), 10),
(33, 'KOU', 'Koupé-Manengouba', 'Koupé-Manengouba', 'Département du Koupé-Manengouba', '1', '1', NOW(), NOW(), 10),
(34, 'LEB', 'Lebialem', 'Lebialem', 'Département du Lebialem', '1', '1', NOW(), NOW(), 10),
(35, 'MAN', 'Manyu', 'Manyu', 'Département du Manyu', '1', '1', NOW(), NOW(), 10),
(36, 'MEM', 'Meme', 'Meme', 'Département du Meme', '1', '1', NOW(), NOW(), 10),
(37, 'NDI', 'Ndian', 'Ndian', 'Département du Ndian', '1', '1', NOW(), NOW(), 10);

-- Insert Arrondissements (sample from major departments)
INSERT INTO arrondissement (code, code_departement, code_region, abbreviation, libelle, description, code_createur, code_modificateur, date_creation, date_modification) VALUES
-- Mfoundi (Yaoundé) - 7 arrondissements
(1, 6, 2, 'YDE1', 'Yaoundé I', 'Arrondissement de Yaoundé I', '1', '1', NOW(), NOW()),
(2, 6, 2, 'YDE2', 'Yaoundé II', 'Arrondissement de Yaoundé II', '1', '1', NOW(), NOW()),
(3, 6, 2, 'YDE3', 'Yaoundé III', 'Arrondissement de Yaoundé III', '1', '1', NOW(), NOW()),
(4, 6, 2, 'YDE4', 'Yaoundé IV', 'Arrondissement de Yaoundé IV', '1', '1', NOW(), NOW()),
(5, 6, 2, 'YDE5', 'Yaoundé V', 'Arrondissement de Yaoundé V', '1', '1', NOW(), NOW()),
(6, 6, 2, 'YDE6', 'Yaoundé VI', 'Arrondissement de Yaoundé VI', '1', '1', NOW(), NOW()),
(7, 6, 2, 'YDE7', 'Yaoundé VII', 'Arrondissement de Yaoundé VII', '1', '1', NOW(), NOW()),

-- Wouri (Douala) - 5 arrondissements
(8, 13, 5, 'DLA1', 'Douala I', 'Arrondissement de Douala I', '1', '1', NOW(), NOW()),
(9, 13, 5, 'DLA2', 'Douala II', 'Arrondissement de Douala II', '1', '1', NOW(), NOW()),
(10, 13, 5, 'DLA3', 'Douala III', 'Arrondissement de Douala III', '1', '1', NOW(), NOW()),
(11, 13, 5, 'DLA4', 'Douala IV', 'Arrondissement de Douala IV', '1', '1', NOW(), NOW()),
(12, 13, 5, 'DLA5', 'Douala V', 'Arrondissement de Douala V', '1', '1', NOW(), NOW()),

-- Fako (Buea) - 4 arrondissements
(13, 32, 10, 'BUE1', 'Buéa', 'Arrondissement de Buéa', '1', '1', NOW(), NOW()),
(14, 32, 10, 'LIM', 'Limbé', 'Arrondissement de Limbé', '1', '1', NOW(), NOW()),
(15, 32, 10, 'TIK', 'Tiko', 'Arrondissement de Tiko', '1', '1', NOW(), NOW()),
(16, 32, 10, 'MUE', 'Muéa', 'Arrondissement de Muéa', '1', '1', NOW(), NOW()),

-- Mezam (Bamenda) - 3 arrondissements
(17, 20, 7, 'BAM1', 'Bamenda I', 'Arrondissement de Bamenda I', '1', '1', NOW(), NOW()),
(18, 20, 7, 'BAM2', 'Bamenda II', 'Arrondissement de Bamenda II', '1', '1', NOW(), NOW()),
(19, 20, 7, 'BAM3', 'Bamenda III', 'Arrondissement de Bamenda III', '1', '1', NOW(), NOW()),

-- Noun (Foumban) - 2 arrondissements
(20, 30, 8, 'FOU', 'Foumban', 'Arrondissement de Foumban', '1', '1', NOW(), NOW()),
(21, 30, 8, 'KOU', 'Koung-Khi', 'Arrondissement de Koung-Khi', '1', '1', NOW(), NOW());

-- Insert Roles
INSERT INTO role (code, libelle) VALUES
(1, 'Administrateur'),
(2, 'Validateur'),
(3, 'Scrutateur'),
(4, 'Observateur Local'),
(5, 'Superviseur Régional'),
(6, 'Superviseur Départemental'),
(7, 'Superviseur Communal'),
(8, 'Observateur'),
(9, 'Secrétaire'),
(10, 'Président');

-- Insert Permissions
INSERT INTO permission (code, nom_permission, description, code_createur, code_modificateur, date_modification, date_creation) VALUES
(1, 'CREATE', 'Créer des enregistrements', 1, 1, NOW(), NOW()),
(2, 'READ', 'Lire des enregistrements', 1, 1, NOW(), NOW()),
(3, 'UPDATE', 'Modifier des enregistrements', 1, 1, NOW(), NOW()),
(4, 'DELETE', 'Supprimer des enregistrements', 1, 1, NOW(), NOW()),
(5, 'VALIDATE', 'Valider des enregistrements', 1, 1, NOW(), NOW()),
(6, 'APPROVE', 'Approuver des enregistrements', 1, 1, NOW(), NOW()),
(7, 'REJECT', 'Rejeter des enregistrements', 1, 1, NOW(), NOW()),
(8, 'EXPORT', 'Exporter des données', 1, 1, NOW(), NOW()),
(9, 'IMPORT', 'Importer des données', 1, 1, NOW(), NOW()),
(10, 'MANAGE_USERS', 'Gérer les utilisateurs', 1, 1, NOW(), NOW());

-- Insert Role-Permission mappings
INSERT INTO role_permission (code_permission, code_role) VALUES
-- Administrateur - All permissions
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
-- Validateur - Read, Validate, Approve, Reject
(2, 2), (5, 2), (6, 2), (7, 2),
-- Scrutateur - Create, Read, Update
(1, 3), (2, 3), (3, 3),
-- Observateur Local - Read only
(2, 4),
-- Superviseur Départemental - Read, Validate, Approve, Reject
(2, 6), (5, 6), (6, 6), (7, 6);

-- Insert Commission Functions
INSERT INTO fonction_commission (code, libelle, description, date_ajout) VALUES
(1, 'Président', 'Président de la commission', NOW()),
(2, 'Vice-Président', 'Vice-Président de la commission', NOW()),
(3, 'Secrétaire', 'Secrétaire de la commission', NOW()),
(4, 'Secrétaire Adjoint', 'Secrétaire Adjoint de la commission', NOW()),
(5, 'Membre', 'Membre de la commission', NOW()),
(6, 'Observateur', 'Observateur de la commission', NOW()),
(7, 'Représentant Candidat', 'Représentant d\'un candidat', NOW()),
(8, 'Représentant Parti', 'Représentant d\'un parti politique', NOW());

-- =====================================================
-- 3. SEED POLITICAL PARTIES AND CANDIDATES
-- =====================================================

-- Insert Political Parties (Major parties in Cameroon)
INSERT INTO parti_politique (code, designation, abbreviation, description, coloration_bulletin, image, code_candidat, code_createur, code_modificateur, date_creation, date_modification) VALUES
(1, 'Rassemblement Démocratique du Peuple Camerounais', 'RDPC', 'Parti au pouvoir depuis 1982', 'Vert', 'rdpc_logo.png', 1, '1', '1', NOW(), NOW()),
(2, 'Mouvement pour la Renaissance du Cameroun', 'MRC', 'Opposition principale', 'Bleu', 'mrc_logo.png', 2, '1', '1', NOW(), NOW()),
(3, 'Parti Camerounais pour la Réconciliation Nationale', 'PCRN', 'Parti d\'opposition', 'Rouge', 'pcrn_logo.png', 3, '1', '1', NOW(), NOW()),
(4, 'Front Social National du Cameroun', 'FSNC', 'Parti d\'opposition', 'Jaune', 'fsnc_logo.png', 4, '1', '1', NOW(), NOW()),
(5, 'Union Nationale pour la Démocratie et le Progrès', 'UNDP', 'Parti d\'opposition', 'Orange', 'undp_logo.png', 5, '1', '1', NOW(), NOW()),
(6, 'Union des Populations du Cameroun', 'UPC', 'Parti historique', 'Vert et Rouge', 'upc_logo.png', 6, '1', '1', NOW(), NOW()),
(7, 'Parti Socialiste du Cameroun', 'PSC', 'Parti socialiste', 'Rouge', 'psc_logo.png', 7, '1', '1', NOW(), NOW()),
(8, 'Alliance pour la Démocratie et le Développement', 'ADD', 'Alliance politique', 'Violet', 'add_logo.png', 8, '1', '1', NOW(), NOW()),
(9, 'Mouvement Progressiste', 'MP', 'Mouvement progressiste', 'Bleu Marine', 'mp_logo.png', 9, '1', '1', NOW(), NOW()),
(10, 'Parti Libéral du Cameroun', 'PLC', 'Parti libéral', 'Bleu Ciel', 'plc_logo.png', 10, '1', '1', NOW(), NOW());

-- Insert Candidates
INSERT INTO candidat (code, noms_prenoms, photo, date_creation, date_modification, code_createur, code_modificateur) VALUES
(1, 'Paul BIYA', 'paul_biya.jpg', NOW(), NOW(), '1', '1'),
(2, 'Maurice KAMTO', 'maurice_kamto.jpg', NOW(), NOW(), '1', '1'),
(3, 'Joshua OSIH', 'joshua_osih.jpg', NOW(), NOW(), '1', '1'),
(4, 'Cabral LIBII', 'cabral_libii.jpg', NOW(), NOW(), '1', '1'),
(5, 'Garga HAMAN ADJI', 'garga_haman.jpg', NOW(), NOW(), '1', '1'),
(6, 'Adamou Ndam NJOYA', 'adamou_ndam.jpg', NOW(), NOW(), '1', '1'),
(7, 'Serge ESPOIR MATOMBA', 'serge_espoir.jpg', NOW(), NOW(), '1', '1'),
(8, 'Franklin NKWENTI', 'franklin_nkwenti.jpg', NOW(), NOW(), '1', '1'),
(9, 'Prosper NDOUMBE', 'prosper_ndoumbe.jpg', NOW(), NOW(), '1', '1'),
(10, 'Albert DZONGANG', 'albert_dzongang.jpg', NOW(), NOW(), '1', '1');

-- =====================================================
-- 4. SEED USERS WITH DIFFERENT ROLES
-- =====================================================

-- Insert Users with different roles
INSERT INTO utilisateur (code, noms_prenoms, email, password, last_login, boite_postale, adresse, contact, code_role, code_createur, code_modificateur, date_creation, date_modification, username, statut_vie) VALUES
-- Administrators
(1, 'Admin Système', 'admin@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 1234', 'Yaoundé', '+237 6XX XXX XXX', 1, '1', '1', NOW(), NOW(), 'admin', 1),
(2, 'Super Admin', 'superadmin@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 5678', 'Douala', '+237 6XX XXX XXX', 1, '1', '1', NOW(), NOW(), 'superadmin', 1),

-- Validators
(3, 'Jean VALIDATEUR', 'jean.validateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 1001', 'Yaoundé', '+237 6XX XXX XXX', 2, '1', '1', NOW(), NOW(), 'jvalidateur', 1),
(4, 'Marie VALIDATEUR', 'marie.validateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 1002', 'Douala', '+237 6XX XXX XXX', 2, '1', '1', NOW(), NOW(), 'mvalidateur', 1),
(5, 'Pierre VALIDATEUR', 'pierre.validateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 1003', 'Buea', '+237 6XX XXX XXX', 2, '1', '1', NOW(), NOW(), 'pvalidateur', 1),

-- Scrutators
(6, 'Alice SCRUTATEUR', 'alice.scrutateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 2001', 'Yaoundé', '+237 6XX XXX XXX', 3, '1', '1', NOW(), NOW(), 'ascrutateur', 1),
(7, 'Bob SCRUTATEUR', 'bob.scrutateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 2002', 'Douala', '+237 6XX XXX XXX', 3, '1', '1', NOW(), NOW(), 'bscrutateur', 1),
(8, 'Claire SCRUTATEUR', 'claire.scrutateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 2003', 'Buea', '+237 6XX XXX XXX', 3, '1', '1', NOW(), NOW(), 'cscrutateur', 1),
(9, 'David SCRUTATEUR', 'david.scrutateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 2004', 'Bamenda', '+237 6XX XXX XXX', 3, '1', '1', NOW(), NOW(), 'dscrutateur', 1),

-- Local Observers
(10, 'Eve OBSERVATEUR', 'eve.observateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 3001', 'Yaoundé', '+237 6XX XXX XXX', 4, '1', '1', NOW(), NOW(), 'eobservateur', 1),
(11, 'Frank OBSERVATEUR', 'frank.observateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 3002', 'Douala', '+237 6XX XXX XXX', 4, '1', '1', NOW(), NOW(), 'fobservateur', 1),
(12, 'Grace OBSERVATEUR', 'grace.observateur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 3003', 'Buea', '+237 6XX XXX XXX', 4, '1', '1', NOW(), NOW(), 'gobservateur', 1),

-- Departmental Supervisors
(13, 'Henry SUPERVISEUR', 'henry.superviseur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 4001', 'Yaoundé', '+237 6XX XXX XXX', 6, '1', '1', NOW(), NOW(), 'hsuperviseur', 1),
(14, 'Iris SUPERVISEUR', 'iris.superviseur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 4002', 'Douala', '+237 6XX XXX XXX', 6, '1', '1', NOW(), NOW(), 'isuperviseur', 1),
(15, 'Jack SUPERVISEUR', 'jack.superviseur@elections.cm', '$2b$10$rQZ8K9vL2mN3pO4qR5sT6uV7wX8yZ9aB0cD1eF2gH3iJ4kL5mN6oP7qR8sT9uV', NOW(), 'BP 4003', 'Buea', '+237 6XX XXX XXX', 6, '1', '1', NOW(), NOW(), 'jsuperviseur', 1);

-- =====================================================
-- 5. SEED TERRITORIAL ASSIGNMENTS
-- =====================================================

-- Insert User Department Assignments
INSERT INTO utilisateur_departement (code_utilisateur, code_departement, date_affectation) VALUES
-- Administrators - All departments
(1, 6, NOW()), (1, 13, NOW()), (1, 32, NOW()), (1, 20, NOW()), (1, 30, NOW()),
(2, 6, NOW()), (2, 13, NOW()), (2, 32, NOW()), (2, 20, NOW()), (2, 30, NOW()),

-- Validators - Specific departments
(3, 6, NOW()), -- Jean - Mfoundi
(4, 13, NOW()), -- Marie - Wouri
(5, 32, NOW()), -- Pierre - Fako

-- Scrutators - Specific departments
(6, 6, NOW()), -- Alice - Mfoundi
(7, 13, NOW()), -- Bob - Wouri
(8, 32, NOW()), -- Claire - Fako
(9, 20, NOW()), -- David - Mezam

-- Observers - Specific departments
(10, 6, NOW()), -- Eve - Mfoundi
(11, 13, NOW()), -- Frank - Wouri
(12, 32, NOW()), -- Grace - Fako

-- Supervisors - Specific departments
(13, 6, NOW()), -- Henry - Mfoundi
(14, 13, NOW()), -- Iris - Wouri
(15, 32, NOW()); -- Jack - Fako

-- Insert User Arrondissement Assignments
INSERT INTO utilisateur_arrondissement (code_utilisateur, code_arrondissement, date_affectation) VALUES
-- Validators - Specific arrondissements
(3, 1, NOW()), (3, 2, NOW()), -- Jean - Yaoundé I & II
(4, 8, NOW()), (4, 9, NOW()), -- Marie - Douala I & II
(5, 13, NOW()), (5, 14, NOW()), -- Pierre - Buéa & Limbé

-- Scrutators - Specific arrondissements
(6, 1, NOW()), (6, 2, NOW()), (6, 3, NOW()), -- Alice - Yaoundé I, II, III
(7, 8, NOW()), (7, 9, NOW()), (7, 10, NOW()), -- Bob - Douala I, II, III
(8, 13, NOW()), (8, 14, NOW()), (8, 15, NOW()), -- Claire - Buéa, Limbé, Tiko
(9, 17, NOW()), (9, 18, NOW()), (9, 19, NOW()), -- David - Bamenda I, II, III

-- Observers - Specific arrondissements
(10, 1, NOW()), (10, 2, NOW()), -- Eve - Yaoundé I & II
(11, 8, NOW()), (11, 9, NOW()), -- Frank - Douala I & II
(12, 13, NOW()), (12, 14, NOW()), -- Grace - Buéa & Limbé

-- Supervisors - Multiple arrondissements
(13, 1, NOW()), (13, 2, NOW()), (13, 3, NOW()), (13, 4, NOW()), -- Henry - Yaoundé I, II, III, IV
(14, 8, NOW()), (14, 9, NOW()), (14, 10, NOW()), (14, 11, NOW()), -- Iris - Douala I, II, III, IV
(15, 13, NOW()), (15, 14, NOW()), (15, 15, NOW()), (15, 16, NOW()); -- Jack - Buéa, Limbé, Tiko, Muéa

-- =====================================================
-- 6. SEED POLLING STATIONS
-- =====================================================

-- Insert Polling Stations (Bureaux de Vote)
INSERT INTO bureau_vote (code, designation, description, latitude, longitude, altititude, data_filled, code_arrondissement, code_createur, code_modificateur, date_modification, date_creation, data_incoherent, effectif) VALUES
-- Yaoundé I - 15 polling stations
(1, 'BV 001 - Ecole Publique de Nlongkak', 'Bureau de vote principal de Nlongkak', 3.8667, 11.5167, 750.0, 1, 1, '1', '1', NOW(), NOW(), 0, 450),
(2, 'BV 002 - Lycée Technique de Nlongkak', 'Bureau de vote technique', 3.8670, 11.5170, 752.0, 1, 1, '1', '1', NOW(), NOW(), 0, 380),
(3, 'BV 003 - Ecole Privée Saint Joseph', 'Bureau de vote privé', 3.8665, 11.5165, 748.0, 1, 1, '1', '1', NOW(), NOW(), 0, 320),
(4, 'BV 004 - Centre Communautaire Nlongkak', 'Bureau de vote communautaire', 3.8668, 11.5168, 751.0, 1, 1, '1', '1', NOW(), NOW(), 0, 280),
(5, 'BV 005 - Ecole Publique de Mvog-Ada', 'Bureau de vote Mvog-Ada', 3.8662, 11.5162, 745.0, 1, 1, '1', '1', NOW(), NOW(), 0, 420),

-- Yaoundé II - 12 polling stations
(6, 'BV 006 - Lycée de Mvog-Mbi', 'Bureau de vote Mvog-Mbi', 3.8700, 11.5200, 760.0, 1, 2, '1', '1', NOW(), NOW(), 0, 500),
(7, 'BV 007 - Ecole Publique de Mvog-Mbi', 'Bureau de vote public Mvog-Mbi', 3.8705, 11.5205, 762.0, 1, 2, '1', '1', NOW(), NOW(), 0, 350),
(8, 'BV 008 - Centre Culturel Mvog-Mbi', 'Bureau de vote culturel', 3.8695, 11.5195, 758.0, 1, 2, '1', '1', NOW(), NOW(), 0, 300),

-- Douala I - 18 polling stations
(9, 'BV 009 - Ecole Publique de Bonanjo', 'Bureau de vote Bonanjo', 4.0500, 9.7000, 10.0, 1, 8, '1', '1', NOW(), NOW(), 0, 600),
(10, 'BV 010 - Lycée Technique de Bonanjo', 'Bureau de vote technique Bonanjo', 4.0505, 9.7005, 12.0, 1, 8, '1', '1', NOW(), NOW(), 0, 450),
(11, 'BV 011 - Ecole Privée de Bonanjo', 'Bureau de vote privé Bonanjo', 4.0495, 9.6995, 8.0, 1, 8, '1', '1', NOW(), NOW(), 0, 380),
(12, 'BV 012 - Centre Commercial Bonanjo', 'Bureau de vote commercial', 4.0502, 9.7002, 11.0, 1, 8, '1', '1', NOW(), NOW(), 0, 320),

-- Douala II - 15 polling stations
(13, 'BV 013 - Ecole Publique de New-Bell', 'Bureau de vote New-Bell', 4.0600, 9.7100, 15.0, 1, 9, '1', '1', NOW(), NOW(), 0, 550),
(14, 'BV 014 - Lycée de New-Bell', 'Bureau de vote lycée New-Bell', 4.0605, 9.7105, 17.0, 1, 9, '1', '1', NOW(), NOW(), 0, 400),
(15, 'BV 015 - Centre Communautaire New-Bell', 'Bureau de vote communautaire New-Bell', 4.0595, 9.7095, 13.0, 1, 9, '1', '1', NOW(), NOW(), 0, 350),

-- Buéa - 10 polling stations
(16, 'BV 016 - Ecole Publique de Buéa Centre', 'Bureau de vote Buéa Centre', 4.1500, 9.2900, 1000.0, 1, 13, '1', '1', NOW(), NOW(), 0, 480),
(17, 'BV 017 - Lycée de Buéa', 'Bureau de vote lycée Buéa', 4.1505, 9.2905, 1002.0, 1, 13, '1', '1', NOW(), NOW(), 0, 420),
(18, 'BV 018 - Ecole Privée de Buéa', 'Bureau de vote privé Buéa', 4.1495, 9.2895, 998.0, 1, 13, '1', '1', NOW(), NOW(), 0, 360),

-- Limbé - 8 polling stations
(19, 'BV 019 - Ecole Publique de Limbé Centre', 'Bureau de vote Limbé Centre', 4.0000, 9.2000, 0.0, 1, 14, '1', '1', NOW(), NOW(), 0, 520),
(20, 'BV 020 - Lycée de Limbé', 'Bureau de vote lycée Limbé', 4.0005, 9.2005, 2.0, 1, 14, '1', '1', NOW(), NOW(), 0, 380),

-- Bamenda I - 12 polling stations
(21, 'BV 021 - Ecole Publique de Bamenda Centre', 'Bureau de vote Bamenda Centre', 5.9600, 10.1600, 1200.0, 1, 17, '1', '1', NOW(), NOW(), 0, 450),
(22, 'BV 022 - Lycée de Bamenda', 'Bureau de vote lycée Bamenda', 5.9605, 10.1605, 1202.0, 1, 17, '1', '1', NOW(), NOW(), 0, 400),
(23, 'BV 023 - Centre Commercial Bamenda', 'Bureau de vote commercial Bamenda', 5.9595, 10.1595, 1198.0, 1, 17, '1', '1', NOW(), NOW(), 0, 320),

-- Additional polling stations for more realistic data
(24, 'BV 024 - Ecole Publique de Yaoundé III', 'Bureau de vote Yaoundé III', 3.8800, 11.5300, 780.0, 1, 3, '1', '1', NOW(), NOW(), 0, 380),
(25, 'BV 025 - Lycée de Yaoundé III', 'Bureau de vote lycée Yaoundé III', 3.8805, 11.5305, 782.0, 1, 3, '1', '1', NOW(), NOW(), 0, 350),
(26, 'BV 026 - Ecole Publique de Douala III', 'Bureau de vote Douala III', 4.0700, 9.7200, 20.0, 1, 10, '1', '1', NOW(), NOW(), 0, 420),
(27, 'BV 027 - Lycée de Douala III', 'Bureau de vote lycée Douala III', 4.0705, 9.7205, 22.0, 1, 10, '1', '1', NOW(), NOW(), 0, 380),
(28, 'BV 028 - Ecole Publique de Tiko', 'Bureau de vote Tiko', 4.0800, 9.3600, 50.0, 1, 15, '1', '1', NOW(), NOW(), 0, 300),
(29, 'BV 029 - Lycée de Tiko', 'Bureau de vote lycée Tiko', 4.0805, 9.3605, 52.0, 1, 15, '1', '1', NOW(), NOW(), 0, 280),
(30, 'BV 030 - Ecole Publique de Foumban', 'Bureau de vote Foumban', 5.7300, 10.9000, 1100.0, 1, 20, '1', '1', NOW(), NOW(), 0, 350);

-- Insert User Bureau Vote Assignments
INSERT INTO utilisateur_bureau_vote (code_utilisateur, code_bureau_vote, date_affectation) VALUES
-- Scrutators assigned to specific polling stations
(6, 1, NOW()), (6, 2, NOW()), (6, 3, NOW()), -- Alice - BV 001, 002, 003
(7, 9, NOW()), (7, 10, NOW()), (7, 11, NOW()), -- Bob - BV 009, 010, 011
(8, 16, NOW()), (8, 17, NOW()), (8, 18, NOW()), -- Claire - BV 016, 017, 018
(9, 21, NOW()), (9, 22, NOW()), (9, 23, NOW()), -- David - BV 021, 022, 023

-- Observers assigned to specific polling stations
(10, 1, NOW()), (10, 2, NOW()), -- Eve - BV 001, 002
(11, 9, NOW()), (11, 10, NOW()), -- Frank - BV 009, 010
(12, 16, NOW()), (12, 17, NOW()); -- Grace - BV 016, 017

-- =====================================================
-- 7. SEED COMMISSION DATA
-- =====================================================

-- Insert Departmental Commissions
INSERT INTO commission_departementale (code, code_departement, libelle, description, date_creation, date_modification) VALUES
(1, 6, 'Commission Départementale de Mfoundi', 'Commission électorale du département de Mfoundi', NOW(), NOW()),
(2, 13, 'Commission Départementale du Wouri', 'Commission électorale du département du Wouri', NOW(), NOW()),
(3, 32, 'Commission Départementale du Fako', 'Commission électorale du département du Fako', NOW(), NOW()),
(4, 20, 'Commission Départementale du Mezam', 'Commission électorale du département du Mezam', NOW(), NOW()),
(5, 30, 'Commission Départementale du Noun', 'Commission électorale du département du Noun', NOW(), NOW());

-- Insert Commission Members
INSERT INTO membre_commission (code, code_commission, code_fonction, noms_prenoms, contact, email, date_creation, date_modification) VALUES
-- Mfoundi Commission Members
(1, 1, 1, 'Dr. Jean MBOUMBA', '+237 6XX XXX XXX', 'jean.mboumba@commission.cm', NOW(), NOW()),
(2, 1, 2, 'Mme Marie FOUDA', '+237 6XX XXX XXX', 'marie.fouda@commission.cm', NOW(), NOW()),
(3, 1, 3, 'M. Pierre ATANGANA', '+237 6XX XXX XXX', 'pierre.atangana@commission.cm', NOW(), NOW()),
(4, 1, 4, 'Mme Alice NKONO', '+237 6XX XXX XXX', 'alice.nkono@commission.cm', NOW(), NOW()),
(5, 1, 5, 'M. David MBALLA', '+237 6XX XXX XXX', 'david.mballa@commission.cm', NOW(), NOW()),
(6, 1, 6, 'Mme Grace TCHOUPOU', '+237 6XX XXX XXX', 'grace.tchoupou@commission.cm', NOW(), NOW()),

-- Wouri Commission Members
(7, 2, 1, 'Dr. Henry DIBONGUE', '+237 6XX XXX XXX', 'henry.dibongue@commission.cm', NOW(), NOW()),
(8, 2, 2, 'Mme Iris MBOUMBA', '+237 6XX XXX XXX', 'iris.mboumba@commission.cm', NOW(), NOW()),
(9, 2, 3, 'M. Jack FOUDA', '+237 6XX XXX XXX', 'jack.fouda@commission.cm', NOW(), NOW()),
(10, 2, 4, 'Mme Kelly ATANGANA', '+237 6XX XXX XXX', 'kelly.atangana@commission.cm', NOW(), NOW()),
(11, 2, 5, 'M. Leo NKONO', '+237 6XX XXX XXX', 'leo.nkono@commission.cm', NOW(), NOW()),
(12, 2, 6, 'Mme Mona MBALLA', '+237 6XX XXX XXX', 'mona.mballa@commission.cm', NOW(), NOW()),

-- Fako Commission Members
(13, 3, 1, 'Dr. Paul TCHOUPOU', '+237 6XX XXX XXX', 'paul.tchoupou@commission.cm', NOW(), NOW()),
(14, 3, 2, 'Mme Queen DIBONGUE', '+237 6XX XXX XXX', 'queen.dibongue@commission.cm', NOW(), NOW()),
(15, 3, 3, 'M. Robert MBOUMBA', '+237 6XX XXX XXX', 'robert.mboumba@commission.cm', NOW(), NOW()),
(16, 3, 4, 'Mme Sarah FOUDA', '+237 6XX XXX XXX', 'sarah.fouda@commission.cm', NOW(), NOW()),
(17, 3, 5, 'M. Tom ATANGANA', '+237 6XX XXX XXX', 'tom.atangana@commission.cm', NOW(), NOW()),
(18, 3, 6, 'Mme Uma NKONO', '+237 6XX XXX XXX', 'uma.nkono@commission.cm', NOW(), NOW()),

-- Mezam Commission Members
(19, 4, 1, 'Dr. Victor MBALLA', '+237 6XX XXX XXX', 'victor.mballa@commission.cm', NOW(), NOW()),
(20, 4, 2, 'Mme Wendy TCHOUPOU', '+237 6XX XXX XXX', 'wendy.tchoupou@commission.cm', NOW(), NOW()),
(21, 4, 3, 'M. Xavier DIBONGUE', '+237 6XX XXX XXX', 'xavier.dibongue@commission.cm', NOW(), NOW()),
(22, 4, 4, 'Mme Yara MBOUMBA', '+237 6XX XXX XXX', 'yara.mboumba@commission.cm', NOW(), NOW()),
(23, 4, 5, 'M. Zack FOUDA', '+237 6XX XXX XXX', 'zack.fouda@commission.cm', NOW(), NOW()),
(24, 4, 6, 'Mme Amy ATANGANA', '+237 6XX XXX XXX', 'amy.atangana@commission.cm', NOW(), NOW()),

-- Noun Commission Members
(25, 5, 1, 'Dr. Ben NKONO', '+237 6XX XXX XXX', 'ben.nkono@commission.cm', NOW(), NOW()),
(26, 5, 2, 'Mme Carol MBALLA', '+237 6XX XXX XXX', 'carol.mballa@commission.cm', NOW(), NOW()),
(27, 5, 3, 'M. Dan TCHOUPOU', '+237 6XX XXX XXX', 'dan.tchoupou@commission.cm', NOW(), NOW()),
(28, 5, 4, 'Mme Eve DIBONGUE', '+237 6XX XXX XXX', 'eve.dibongue@commission.cm', NOW(), NOW()),
(29, 5, 5, 'M. Frank MBOUMBA', '+237 6XX XXX XXX', 'frank.mboumba@commission.cm', NOW(), NOW()),
(30, 5, 6, 'Mme Gina FOUDA', '+237 6XX XXX XXX', 'gina.fouda@commission.cm', NOW(), NOW());

-- =====================================================
-- 8. SEED PARTICIPATION AND RESULTS DATA
-- =====================================================

-- Insert Departmental Participation Data
INSERT INTO participation_departement (code, code_departement, nombre_bureau_vote, nombre_inscrit, nombre_enveloppe_urnes, nombre_enveloppe_bulletins_differents, nombre_bulletin_electeur_identifiable, nombre_bulletin_enveloppes_signes, nombre_enveloppe_non_elecam, nombre_bulletin_non_elecam, nombre_bulletin_sans_enveloppe, nombre_enveloppe_vide, nombre_suffrages_valable, nombre_votant, bulletin_nul, suffrage_exprime, taux_participation, date_creation) VALUES
-- Mfoundi (Yaoundé) - High participation
(1, 6, 45, 125000, 85000, 450, 380, 420, 180, 120, 95, 150, 82000, 85000, 3000, 82000, 68.0, NOW()),

-- Wouri (Douala) - Very high participation
(2, 13, 38, 180000, 125000, 380, 320, 350, 150, 100, 80, 120, 122000, 125000, 3000, 122000, 69.4, NOW()),

-- Fako (Buea) - Medium participation
(3, 32, 25, 85000, 58000, 250, 200, 220, 100, 80, 60, 90, 56000, 58000, 2000, 56000, 68.2, NOW()),

-- Mezam (Bamenda) - Medium participation
(4, 20, 22, 75000, 52000, 220, 180, 200, 90, 70, 50, 80, 50000, 52000, 2000, 50000, 69.3, NOW()),

-- Noun (Foumban) - Lower participation
(5, 30, 18, 60000, 38000, 180, 150, 170, 80, 60, 40, 70, 36000, 38000, 2000, 36000, 63.3, NOW());

-- Insert Departmental Results Data
INSERT INTO resultat_departement (code, code_departement, code_parti, nombre_vote, pourcentage, date_creation) VALUES
-- Mfoundi Results (RDPC stronghold)
(1, 6, 1, 45000, 54.88, NOW()), -- RDPC
(2, 6, 2, 22000, 26.83, NOW()), -- MRC
(3, 6, 3, 8000, 9.76, NOW()),   -- PCRN
(4, 6, 4, 4000, 4.88, NOW()),   -- FSNC
(5, 6, 5, 3000, 3.66, NOW()),   -- UNDP

-- Wouri Results (Competitive)
(6, 13, 1, 60000, 49.18, NOW()), -- RDPC
(7, 13, 2, 45000, 36.89, NOW()), -- MRC
(8, 13, 3, 10000, 8.20, NOW()),  -- PCRN
(9, 13, 4, 5000, 4.10, NOW()),   -- FSNC
(10, 13, 5, 2000, 1.64, NOW()),  -- UNDP

-- Fako Results (MRC stronghold)
(11, 32, 1, 25000, 44.64, NOW()), -- RDPC
(12, 32, 2, 28000, 50.00, NOW()), -- MRC
(13, 32, 3, 2000, 3.57, NOW()),   -- PCRN
(14, 32, 4, 1000, 1.79, NOW()),   -- FSNC
(15, 32, 5, 0, 0.00, NOW()),      -- UNDP

-- Mezam Results (Competitive)
(16, 20, 1, 28000, 56.00, NOW()), -- RDPC
(17, 20, 2, 15000, 30.00, NOW()), -- MRC
(18, 20, 3, 5000, 10.00, NOW()),  -- PCRN
(19, 20, 4, 2000, 4.00, NOW()),   -- FSNC
(20, 20, 5, 0, 0.00, NOW()),      -- UNDP

-- Noun Results (RDPC stronghold)
(21, 30, 1, 25000, 69.44, NOW()), -- RDPC
(22, 30, 2, 8000, 22.22, NOW()),  -- MRC
(23, 30, 3, 2000, 5.56, NOW()),   -- PCRN
(24, 30, 4, 1000, 2.78, NOW()),   -- FSNC
(25, 30, 5, 0, 0.00, NOW());      -- UNDP

-- Insert Polling Station Participation Data
INSERT INTO participation (code, code_bureau_vote, nombre_inscrit, nombre_votant, bulletin_nul, suffrage_exprime, taux_participation, code_createur, code_modificateur, date_creation, date_modification, statut_validation) VALUES
-- Yaoundé I polling stations
(1, 1, 450, 320, 15, 305, 71.11, 6, 6, NOW(), NOW(), 1),
(2, 2, 380, 280, 12, 268, 73.68, 6, 6, NOW(), NOW(), 1),
(3, 3, 320, 240, 10, 230, 75.00, 6, 6, NOW(), NOW(), 1),
(4, 4, 280, 200, 8, 192, 71.43, 6, 6, NOW(), NOW(), 1),
(5, 5, 420, 300, 12, 288, 71.43, 6, 6, NOW(), NOW(), 1),

-- Yaoundé II polling stations
(6, 6, 500, 380, 18, 362, 76.00, 6, 6, NOW(), NOW(), 1),
(7, 7, 350, 260, 10, 250, 74.29, 6, 6, NOW(), NOW(), 1),
(8, 8, 300, 220, 8, 212, 73.33, 6, 6, NOW(), NOW(), 1),

-- Douala I polling stations
(9, 9, 600, 450, 20, 430, 75.00, 7, 7, NOW(), NOW(), 1),
(10, 10, 450, 340, 15, 325, 75.56, 7, 7, NOW(), NOW(), 1),
(11, 11, 380, 290, 12, 278, 76.32, 7, 7, NOW(), NOW(), 1),
(12, 12, 320, 240, 10, 230, 75.00, 7, 7, NOW(), NOW(), 1),

-- Douala II polling stations
(13, 13, 550, 420, 18, 402, 76.36, 7, 7, NOW(), NOW(), 1),
(14, 14, 400, 300, 12, 288, 75.00, 7, 7, NOW(), NOW(), 1),
(15, 15, 350, 260, 10, 250, 74.29, 7, 7, NOW(), NOW(), 1),

-- Buéa polling stations
(16, 16, 480, 360, 15, 345, 75.00, 8, 8, NOW(), NOW(), 1),
(17, 17, 420, 320, 12, 308, 76.19, 8, 8, NOW(), NOW(), 1),
(18, 18, 360, 280, 10, 270, 77.78, 8, 8, NOW(), NOW(), 1),

-- Limbé polling stations
(19, 19, 520, 400, 16, 384, 76.92, 8, 8, NOW(), NOW(), 1),
(20, 20, 380, 290, 12, 278, 76.32, 8, 8, NOW(), NOW(), 1),

-- Bamenda polling stations
(21, 21, 450, 340, 14, 326, 75.56, 9, 9, NOW(), NOW(), 1),
(22, 22, 400, 300, 12, 288, 75.00, 9, 9, NOW(), NOW(), 1),
(23, 23, 320, 240, 10, 230, 75.00, 9, 9, NOW(), NOW(), 1),

-- Additional polling stations
(24, 24, 380, 290, 12, 278, 76.32, 6, 6, NOW(), NOW(), 1),
(25, 25, 350, 260, 10, 250, 74.29, 6, 6, NOW(), NOW(), 1),
(26, 26, 420, 320, 13, 307, 76.19, 7, 7, NOW(), NOW(), 1),
(27, 27, 380, 290, 12, 278, 76.32, 7, 7, NOW(), NOW(), 1),
(28, 28, 300, 220, 9, 211, 73.33, 8, 8, NOW(), NOW(), 1),
(29, 29, 280, 210, 8, 202, 75.00, 8, 8, NOW(), NOW(), 1),
(30, 30, 350, 260, 10, 250, 74.29, 9, 9, NOW(), NOW(), 1);

-- Insert Polling Station Results Data
INSERT INTO resultat (code, code_bureau, code_parti_politique, nombre_vote, code_createur, code_modificateur, date_creation, date_modification, statut_validation, code_participation) VALUES
-- BV 001 Results (Yaoundé I - RDPC stronghold)
(1, 1, 1, 180, '6', '6', NOW(), NOW(), 1, 1), -- RDPC
(2, 1, 2, 80, '6', '6', NOW(), NOW(), 1, 1),  -- MRC
(3, 1, 3, 30, '6', '6', NOW(), NOW(), 1, 1),  -- PCRN
(4, 1, 4, 15, '6', '6', NOW(), NOW(), 1, 1),  -- FSNC

-- BV 002 Results (Yaoundé I - RDPC stronghold)
(5, 2, 1, 150, '6', '6', NOW(), NOW(), 1, 2), -- RDPC
(6, 2, 2, 70, '6', '6', NOW(), NOW(), 1, 2),  -- MRC
(7, 2, 3, 30, '6', '6', NOW(), NOW(), 1, 2),  -- PCRN
(8, 2, 4, 18, '6', '6', NOW(), NOW(), 1, 2),  -- FSNC

-- BV 009 Results (Douala I - Competitive)
(9, 9, 1, 200, '7', '7', NOW(), NOW(), 1, 9),  -- RDPC
(10, 9, 2, 180, '7', '7', NOW(), NOW(), 1, 9), -- MRC
(11, 9, 3, 30, '7', '7', NOW(), NOW(), 1, 9),  -- PCRN
(12, 9, 4, 20, '7', '7', NOW(), NOW(), 1, 9),  -- FSNC

-- BV 016 Results (Buéa - MRC stronghold)
(13, 16, 1, 150, '8', '8', NOW(), NOW(), 1, 16), -- RDPC
(14, 16, 2, 180, '8', '8', NOW(), NOW(), 1, 16), -- MRC
(15, 16, 3, 10, '8', '8', NOW(), NOW(), 1, 16),  -- PCRN
(16, 16, 4, 5, '8', '8', NOW(), NOW(), 1, 16),   -- FSNC

-- BV 021 Results (Bamenda - RDPC stronghold)
(17, 21, 1, 200, '9', '9', NOW(), NOW(), 1, 21), -- RDPC
(18, 21, 2, 90, '9', '9', NOW(), NOW(), 1, 21),  -- MRC
(19, 21, 3, 25, '9', '9', NOW(), NOW(), 1, 21),  -- PCRN
(20, 21, 4, 11, '9', '9', NOW(), NOW(), 1, 21);  -- FSNC

-- =====================================================
-- 9. SEED REDRESSEMENT DATA (ADJUSTMENTS)
-- =====================================================

-- Insert Candidate Adjustments (Redressement Candidat)
INSERT INTO redressement_candidat (code, code_bureau_vote, code_parti, nombre_vote_initial, nombre_vote_redresse, raison_redressement, date_redressement, code_createur, code_modificateur, date_creation, date_modification, statut_validation) VALUES
-- BV 001 Adjustments
(1, 1, 1, 180, 185, 'Erreur de comptage détectée lors de la vérification', NOW(), '6', '6', NOW(), NOW(), 1),
(2, 1, 2, 80, 75, 'Bulletins mal comptés corrigés', NOW(), '6', '6', NOW(), NOW(), 1),

-- BV 002 Adjustments
(3, 2, 1, 150, 155, 'Bulletins oubliés dans le premier comptage', NOW(), '6', '6', NOW(), NOW(), 1),
(4, 2, 3, 30, 25, 'Bulletins nuls mal classés', NOW(), '6', '6', NOW(), NOW(), 1),

-- BV 009 Adjustments
(5, 9, 2, 180, 185, 'Erreur de transcription corrigée', NOW(), '7', '7', NOW(), NOW(), 1),
(6, 9, 4, 20, 18, 'Bulletins endommagés retirés', NOW(), '7', '7', NOW(), NOW(), 1),

-- BV 016 Adjustments
(7, 16, 1, 150, 145, 'Bulletins non conformes retirés', NOW(), '8', '8', NOW(), NOW(), 1),
(8, 16, 2, 180, 185, 'Bulletins mal comptés corrigés', NOW(), '8', '8', NOW(), NOW(), 1),

-- BV 021 Adjustments
(9, 21, 1, 200, 195, 'Bulletins nuls mal classés', NOW(), '9', '9', NOW(), NOW(), 1),
(10, 21, 3, 25, 30, 'Bulletins oubliés dans le premier comptage', NOW(), '9', '9', NOW(), NOW(), 1);

-- Insert Polling Station Adjustments (Redressement Bureau Vote)
INSERT INTO redressement_bureau_vote (code, code_bureau_vote, nombre_inscrit_initial, nombre_inscrit_redresse, nombre_votant_initial, nombre_votant_redresse, bulletin_nul_initial, bulletin_nul_redresse, suffrage_exprime_initial, suffrage_exprime_redresse, raison_redressement, date_redressement, code_createur, code_modificateur, date_creation, date_modification, statut_validation) VALUES
-- BV 001 Polling Station Adjustments
(1, 1, 450, 450, 320, 325, 15, 10, 305, 315, 'Correction des données après vérification des listes électorales', NOW(), '6', '6', NOW(), NOW(), 1),

-- BV 002 Polling Station Adjustments
(2, 2, 380, 380, 280, 285, 12, 8, 268, 277, 'Erreur de saisie corrigée après contrôle', NOW(), '6', '6', NOW(), NOW(), 1),

-- BV 009 Polling Station Adjustments
(3, 9, 600, 600, 450, 455, 20, 15, 430, 440, 'Bulletins nuls mal classés corrigés', NOW(), '7', '7', NOW(), NOW(), 1),

-- BV 016 Polling Station Adjustments
(4, 16, 480, 480, 360, 365, 15, 12, 345, 353, 'Correction après vérification des procès-verbaux', NOW(), '8', '8', NOW(), NOW(), 1),

-- BV 021 Polling Station Adjustments
(5, 21, 450, 450, 340, 345, 14, 10, 326, 335, 'Erreur de comptage corrigée', NOW(), '9', '9', NOW(), NOW(), 1);

-- =====================================================
-- 10. SEED DOCUMENT SUBMISSIONS AND VALIDATION
-- =====================================================

-- Insert Process Verbaux (PV) Data
INSERT INTO proces_verbaux (code, code_bureau_vote, url_pv, hash_file, timestamp) VALUES
-- Yaoundé I PVs
(1, 1, '/documents/pv/bv001_pv.pdf', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', NOW()),
(2, 2, '/documents/pv/bv002_pv.pdf', 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7', NOW()),
(3, 3, '/documents/pv/bv003_pv.pdf', 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8', NOW()),

-- Douala I PVs
(4, 9, '/documents/pv/bv009_pv.pdf', 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9', NOW()),
(5, 10, '/documents/pv/bv010_pv.pdf', 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', NOW()),
(6, 11, '/documents/pv/bv011_pv.pdf', 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1', NOW()),

-- Buéa PVs
(7, 16, '/documents/pv/bv016_pv.pdf', 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2', NOW()),
(8, 17, '/documents/pv/bv017_pv.pdf', 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3', NOW()),
(9, 18, '/documents/pv/bv018_pv.pdf', 'i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4', NOW()),

-- Bamenda PVs
(10, 21, '/documents/pv/bv021_pv.pdf', 'j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5', NOW()),
(11, 22, '/documents/pv/bv022_pv.pdf', 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6', NOW()),
(12, 23, '/documents/pv/bv023_pv.pdf', 'l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7', NOW());

-- Insert Arrondissement PVs
INSERT INTO pv_arrondissement (code, code_arrondissement, url_pv, hash_file, libelle, timestamp) VALUES
-- Yaoundé I PV
(1, 1, '/documents/pv/arrondissement_yde1_pv.pdf', 'arr1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'PV Arrondissement Yaoundé I', NOW()),

-- Yaoundé II PV
(2, 2, '/documents/pv/arrondissement_yde2_pv.pdf', 'arr2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7', 'PV Arrondissement Yaoundé II', NOW()),

-- Douala I PV
(3, 8, '/documents/pv/arrondissement_dla1_pv.pdf', 'arr3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8', 'PV Arrondissement Douala I', NOW()),

-- Douala II PV
(4, 9, '/documents/pv/arrondissement_dla2_pv.pdf', 'arr4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9', 'PV Arrondissement Douala II', NOW()),

-- Buéa PV
(5, 13, '/documents/pv/arrondissement_buea_pv.pdf', 'arr5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0', 'PV Arrondissement Buéa', NOW()),

-- Limbé PV
(6, 14, '/documents/pv/arrondissement_limbe_pv.pdf', 'arr6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1', 'PV Arrondissement Limbé', NOW()),

-- Bamenda I PV
(7, 17, '/documents/pv/arrondissement_bamenda1_pv.pdf', 'arr7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2', 'PV Arrondissement Bamenda I', NOW()),

-- Foumban PV
(8, 20, '/documents/pv/arrondissement_foumban_pv.pdf', 'arr8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3', 'PV Arrondissement Foumban', NOW());

-- =====================================================
-- 11. SEED SYNTHESIS DATA
-- =====================================================

-- Insert Arrondissement Synthesis Data
INSERT INTO synthese_arrondissement (code, code_arrondissement, code_parti, nombre_vote, nombre_inscrit, nombre_votant, bulletin_nul, code_createur, code_modificateur, date_creation, date_modification) VALUES
-- Yaoundé I Synthesis
(1, 1, 1, 850, 2250, 1800, 60, '6', '6', NOW(), NOW()), -- RDPC
(2, 1, 2, 380, 2250, 1800, 60, '6', '6', NOW(), NOW()), -- MRC
(3, 1, 3, 150, 2250, 1800, 60, '6', '6', NOW(), NOW()), -- PCRN
(4, 1, 4, 80, 2250, 1800, 60, '6', '6', NOW(), NOW()),  -- FSNC

-- Yaoundé II Synthesis
(5, 2, 1, 720, 1950, 1650, 50, '6', '6', NOW(), NOW()), -- RDPC
(6, 2, 2, 350, 1950, 1650, 50, '6', '6', NOW(), NOW()), -- MRC
(7, 2, 3, 120, 1950, 1650, 50, '6', '6', NOW(), NOW()), -- PCRN
(8, 2, 4, 60, 1950, 1650, 50, '6', '6', NOW(), NOW()),  -- FSNC

-- Douala I Synthesis
(9, 8, 1, 1200, 3000, 2400, 80, '7', '7', NOW(), NOW()), -- RDPC
(10, 8, 2, 900, 3000, 2400, 80, '7', '7', NOW(), NOW()), -- MRC
(11, 8, 3, 200, 3000, 2400, 80, '7', '7', NOW(), NOW()), -- PCRN
(12, 8, 4, 100, 3000, 2400, 80, '7', '7', NOW(), NOW()), -- FSNC

-- Douala II Synthesis
(13, 9, 1, 1000, 2500, 2000, 70, '7', '7', NOW(), NOW()), -- RDPC
(14, 9, 2, 750, 2500, 2000, 70, '7', '7', NOW(), NOW()), -- MRC
(15, 9, 3, 150, 2500, 2000, 70, '7', '7', NOW(), NOW()), -- PCRN
(16, 9, 4, 100, 2500, 2000, 70, '7', '7', NOW(), NOW()), -- FSNC

-- Buéa Synthesis
(17, 13, 1, 600, 1500, 1200, 40, '8', '8', NOW(), NOW()), -- RDPC
(18, 13, 2, 800, 1500, 1200, 40, '8', '8', NOW(), NOW()), -- MRC
(19, 13, 3, 50, 1500, 1200, 40, '8', '8', NOW(), NOW()),  -- PCRN
(20, 13, 4, 30, 1500, 1200, 40, '8', '8', NOW(), NOW()),  -- FSNC

-- Limbé Synthesis
(21, 14, 1, 500, 1200, 1000, 30, '8', '8', NOW(), NOW()), -- RDPC
(22, 14, 2, 600, 1200, 1000, 30, '8', '8', NOW(), NOW()), -- MRC
(23, 14, 3, 40, 1200, 1000, 30, '8', '8', NOW(), NOW()),  -- PCRN
(24, 14, 4, 20, 1200, 1000, 30, '8', '8', NOW(), NOW()),  -- FSNC

-- Bamenda I Synthesis
(25, 17, 1, 800, 2000, 1600, 60, '9', '9', NOW(), NOW()), -- RDPC
(26, 17, 2, 400, 2000, 1600, 60, '9', '9', NOW(), NOW()), -- MRC
(27, 17, 3, 200, 2000, 1600, 60, '9', '9', NOW(), NOW()), -- PCRN
(28, 17, 4, 100, 2000, 1600, 60, '9', '9', NOW(), NOW()); -- FSNC

-- =====================================================
-- 12. SEED JOURNAL/LOG DATA
-- =====================================================

-- Insert Journal Entries
INSERT INTO journal (code, code_utilisateur, action, description, timestamp, code_createur, code_modificateur, date_creation, date_modification) VALUES
(1, '6', 'LOGIN', 'Connexion de l\'utilisateur Alice SCRUTATEUR', NOW(), '6', '6', NOW(), NOW()),
(2, '6', 'CREATE', 'Création des données de participation pour BV 001', NOW(), '6', '6', NOW(), NOW()),
(3, '6', 'UPDATE', 'Mise à jour des résultats pour BV 001', NOW(), '6', '6', NOW(), NOW()),
(4, '6', 'VALIDATE', 'Validation des données pour BV 001', NOW(), '6', '6', NOW(), NOW()),

(5, '7', 'LOGIN', 'Connexion de l\'utilisateur Bob SCRUTATEUR', NOW(), '7', '7', NOW(), NOW()),
(6, '7', 'CREATE', 'Création des données de participation pour BV 009', NOW(), '7', '7', NOW(), NOW()),
(7, '7', 'UPDATE', 'Mise à jour des résultats pour BV 009', NOW(), '7', '7', NOW(), NOW()),
(8, '7', 'VALIDATE', 'Validation des données pour BV 009', NOW(), '7', '7', NOW(), NOW()),

(9, '8', 'LOGIN', 'Connexion de l\'utilisateur Claire SCRUTATEUR', NOW(), '8', '8', NOW(), NOW()),
(10, '8', 'CREATE', 'Création des données de participation pour BV 016', NOW(), '8', '8', NOW(), NOW()),
(11, '8', 'UPDATE', 'Mise à jour des résultats pour BV 016', NOW(), '8', '8', NOW(), NOW()),
(12, '8', 'VALIDATE', 'Validation des données pour BV 016', NOW(), '8', '8', NOW(), NOW()),

(13, '3', 'LOGIN', 'Connexion de l\'utilisateur Jean VALIDATEUR', NOW(), '3', '3', NOW(), NOW()),
(14, '3', 'APPROVE', 'Approbation des données pour Mfoundi', NOW(), '3', '3', NOW(), NOW()),
(15, '3', 'VALIDATE', 'Validation des résultats départementaux pour Mfoundi', NOW(), '3', '3', NOW(), NOW()),

(16, '4', 'LOGIN', 'Connexion de l\'utilisateur Marie VALIDATEUR', NOW(), '4', '4', NOW(), NOW()),
(17, '4', 'APPROVE', 'Approbation des données pour Wouri', NOW(), '4', '4', NOW(), NOW()),
(18, '4', 'VALIDATE', 'Validation des résultats départementaux pour Wouri', NOW(), '4', '4', NOW(), NOW()),

(19, '5', 'LOGIN', 'Connexion de l\'utilisateur Pierre VALIDATEUR', NOW(), '5', '5', NOW(), NOW()),
(20, '5', 'APPROVE', 'Approbation des données pour Fako', NOW(), '5', '5', NOW(), NOW()),
(21, '5', 'VALIDATE', 'Validation des résultats départementaux pour Fako', NOW(), '5', '5', NOW(), NOW()),

(22, '13', 'LOGIN', 'Connexion de l\'utilisateur Henry SUPERVISEUR', NOW(), '13', '13', NOW(), NOW()),
(23, '13', 'SUPERVISE', 'Supervision des opérations pour Mfoundi', NOW(), '13', '13', NOW(), NOW()),
(24, '13', 'APPROVE', 'Approbation finale des résultats pour Mfoundi', NOW(), '13', '13', NOW(), NOW()),

(25, '14', 'LOGIN', 'Connexion de l\'utilisateur Iris SUPERVISEUR', NOW(), '14', '14', NOW(), NOW()),
(26, '14', 'SUPERVISE', 'Supervision des opérations pour Wouri', NOW(), '14', '14', NOW(), NOW()),
(27, '14', 'APPROVE', 'Approbation finale des résultats pour Wouri', NOW(), '14', '14', NOW(), NOW()),

(28, '15', 'LOGIN', 'Connexion de l\'utilisateur Jack SUPERVISEUR', NOW(), '15', '15', NOW(), NOW()),
(29, '15', 'SUPERVISE', 'Supervision des opérations pour Fako', NOW(), '15', '15', NOW(), NOW()),
(30, '15', 'APPROVE', 'Approbation finale des résultats pour Fako', NOW(), '15', '15', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
