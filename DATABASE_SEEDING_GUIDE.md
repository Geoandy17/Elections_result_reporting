# 🌱 Database Seeding Guide
## Comprehensive Election Result Reporting System

This guide explains how to use the comprehensive database seeding script to populate your election database with realistic test data covering various scenarios.

## 📋 Overview

The seeding script (`comprehensive_database_seed.sql`) creates a complete dataset for testing the election result reporting system with:

- **10 regions** of Cameroon
- **37 departments** across major regions
- **21 arrondissements** in key cities
- **30 polling stations** with realistic data
- **10 political parties** and candidates
- **15 users** with different roles and permissions
- **5 departmental commissions** with 30 members
- **Comprehensive voting data** with various scenarios
- **Document submissions** and validation workflows
- **Adjustment/redressement data** for different scenarios

## 🎯 Data Scenarios Covered

### 1. **Political Landscape**
- **RDPC strongholds**: Mfoundi (Yaoundé), Noun (Foumban)
- **MRC strongholds**: Fako (Buea)
- **Competitive areas**: Wouri (Douala), Mezam (Bamenda)
- **Mixed results**: Various polling stations with different outcomes

### 2. **Participation Rates**
- **High participation**: 68-76% (urban areas)
- **Medium participation**: 63-69% (mixed areas)
- **Realistic variations**: Different rates per polling station

### 3. **User Roles & Permissions**
- **Administrators**: Full access to all data
- **Validators**: Can validate, approve, reject data
- **Scrutators**: Can create, read, update data
- **Observers**: Read-only access
- **Supervisors**: Department-level oversight

### 4. **Data Validation Scenarios**
- **Validated data**: Most polling stations marked as validated
- **Adjustments**: Various redressement scenarios
- **Document submissions**: PVs and arrondissement documents
- **Commission workflows**: Complete commission structures

## 🚀 How to Use

### Prerequisites
- MySQL/MariaDB database
- Database named `election` (or modify the script)
- Appropriate permissions to create tables and insert data

### Step 1: Backup Existing Data
```bash
# Create backup of existing database
mysqldump -u username -p election > backup_before_seed.sql
```

### Step 2: Run the Seeding Script
```bash
# Execute the seeding script
mysql -u username -p election < comprehensive_database_seed.sql
```

### Step 3: Verify the Data
```sql
-- Check data counts
SELECT 'Regions' as table_name, COUNT(*) as count FROM region
UNION ALL
SELECT 'Departments', COUNT(*) FROM departement
UNION ALL
SELECT 'Arrondissements', COUNT(*) FROM arrondissement
UNION ALL
SELECT 'Polling Stations', COUNT(*) FROM bureau_vote
UNION ALL
SELECT 'Users', COUNT(*) FROM utilisateur
UNION ALL
SELECT 'Political Parties', COUNT(*) FROM parti_politique
UNION ALL
SELECT 'Candidates', COUNT(*) FROM candidat
UNION ALL
SELECT 'Commissions', COUNT(*) FROM commission_departementale
UNION ALL
SELECT 'Commission Members', COUNT(*) FROM membre_commission
UNION ALL
SELECT 'Departmental Participation', COUNT(*) FROM participation_departement
UNION ALL
SELECT 'Departmental Results', COUNT(*) FROM resultat_departement
UNION ALL
SELECT 'Polling Station Participation', COUNT(*) FROM participation
UNION ALL
SELECT 'Polling Station Results', COUNT(*) FROM resultat
UNION ALL
SELECT 'Adjustments (Candidates)', COUNT(*) FROM redressement_candidat
UNION ALL
SELECT 'Adjustments (Polling Stations)', COUNT(*) FROM redressement_bureau_vote
UNION ALL
SELECT 'Process Verbaux', COUNT(*) FROM proces_verbaux
UNION ALL
SELECT 'Arrondissement PVs', COUNT(*) FROM pv_arrondissement
UNION ALL
SELECT 'Synthesis Data', COUNT(*) FROM synthese_arrondissement
UNION ALL
SELECT 'Journal Entries', COUNT(*) FROM journal;
```

## 👥 Test Users

The script creates 15 test users with different roles:

### Administrators
- **admin** / password: `admin123` (default password)
- **superadmin** / password: `admin123`

### Validators
- **jvalidateur** - Mfoundi (Yaoundé)
- **mvalidateur** - Wouri (Douala)  
- **pvalidateur** - Fako (Buea)

### Scrutators
- **ascrutateur** - Mfoundi (Yaoundé)
- **bscrutateur** - Wouri (Douala)
- **cscrutateur** - Fako (Buea)
- **dscrutateur** - Mezam (Bamenda)

### Observers
- **eobservateur** - Mfoundi (Yaoundé)
- **fobservateur** - Wouri (Douala)
- **gobservateur** - Fako (Buea)

### Supervisors
- **hsuperviseur** - Mfoundi (Yaoundé)
- **isuperviseur** - Wouri (Douala)
- **jsuperviseur** - Fako (Buea)

## 🗺️ Geographic Coverage

### Regions Included
1. **Adamaoua** (5 departments)
2. **Centre** (7 departments) - *Mfoundi included*
3. **Littoral** (4 departments) - *Wouri included*
4. **Nord-Ouest** (7 departments) - *Mezam included*
5. **Ouest** (8 departments) - *Noun included*
6. **Sud-Ouest** (6 departments) - *Fako included*
7. **Est** (4 departments)
8. **Extrême-Nord** (6 departments)
9. **Nord** (4 departments)
10. **Sud** (4 departments)

### Key Cities with Detailed Data
- **Yaoundé** (Mfoundi): 7 arrondissements, 15 polling stations
- **Douala** (Wouri): 5 arrondissements, 18 polling stations
- **Buea** (Fako): 4 arrondissements, 10 polling stations
- **Bamenda** (Mezam): 3 arrondissements, 12 polling stations
- **Foumban** (Noun): 2 arrondissements, 8 polling stations

## 📊 Data Statistics

### Political Results Distribution
- **RDPC**: 45-70% (strongholds), 44-56% (competitive)
- **MRC**: 22-50% (varies by region)
- **PCRN**: 3-10% (opposition)
- **FSNC**: 2-5% (minor party)
- **UNDP**: 0-4% (minor party)

### Participation Rates
- **Urban areas**: 68-76%
- **Semi-urban**: 63-69%
- **Rural areas**: 60-65%

### Validation Status
- **Most data**: Validated (status = 1)
- **Some adjustments**: Pending validation
- **Document submissions**: Complete with hash verification

## 🔧 Customization

### Adding More Data
To add more polling stations or users:

1. **Add polling stations**:
```sql
INSERT INTO bureau_vote (code, designation, description, latitude, longitude, altititude, data_filled, code_arrondissement, code_createur, code_modificateur, date_modification, date_creation, data_incoherent, effectif) VALUES
(31, 'BV 031 - New Station', 'Description', 3.9000, 11.6000, 800.0, 1, 1, '1', '1', NOW(), NOW(), 0, 400);
```

2. **Add users**:
```sql
INSERT INTO utilisateur (code, noms_prenoms, email, password, last_login, boite_postale, adresse, contact, code_role, code_createur, code_modificateur, date_creation, date_modification, username, statut_vie) VALUES
(16, 'New User', 'newuser@elections.cm', '$2b$10$...', NOW(), 'BP 5001', 'City', '+237 6XX XXX XXX', 3, '1', '1', NOW(), NOW(), 'newuser', 1);
```

### Modifying Scenarios
- **Change participation rates**: Modify `taux_participation` values
- **Adjust political results**: Update `nombre_vote` and `pourcentage` values
- **Add validation scenarios**: Change `statut_validation` values

## 🧪 Testing Scenarios

### Role-Based Access Testing
1. **Login as different users** to test role-based access
2. **Try unauthorized actions** to verify permission controls
3. **Test territorial restrictions** by accessing data outside assigned areas

### Data Validation Testing
1. **Submit invalid data** to test validation rules
2. **Test adjustment workflows** with different scenarios
3. **Verify document upload** and validation processes

### Performance Testing
1. **Query large datasets** to test performance
2. **Test concurrent access** with multiple users
3. **Verify data integrity** across related tables

## 🚨 Important Notes

### Security
- **Change default passwords** before production use
- **Review user permissions** for your specific needs
- **Validate all data** before using in production

### Data Integrity
- **Foreign key constraints** are properly maintained
- **Auto-increment values** are reset appropriately
- **Timestamps** are set to current time

### Performance
- **Indexes** are maintained for optimal query performance
- **Data volumes** are realistic but not excessive
- **Relationships** are properly established

## 📈 Next Steps

After running the seeding script:

1. **Test the application** with the seeded data
2. **Verify all features** work correctly
3. **Customize data** for your specific testing needs
4. **Add more scenarios** as needed for comprehensive testing

## 🆘 Troubleshooting

### Common Issues
- **Foreign key errors**: Ensure tables are created in correct order
- **Permission errors**: Check database user permissions
- **Data conflicts**: Clear existing data before seeding

### Recovery
- **Restore from backup** if issues occur
- **Check error logs** for specific problems
- **Verify database schema** matches expected structure

---

**Created**: 2024  
**Version**: 1.0  
**Compatibility**: MySQL 8.0+, MariaDB 10.3+
