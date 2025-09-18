# Guide du Système de Contrôles d'Accès Basés sur les Rôles

## Vue d'ensemble

Ce système implémente des contrôles d'accès granulaires basés sur les rôles pour l'application de gestion électorale. Il permet de restreindre l'accès aux fonctionnalités selon le rôle de l'utilisateur.

## Rôles Disponibles

### 1. Administrateur (`administrateur`)
- **Accès complet** à toutes les fonctionnalités
- Peut gérer tous les arrondissements, commissions, participations et redressements
- Peut créer, modifier, supprimer et valider toutes les entités

### 2. Superviseur Départemental (`superviseur-departementale`)
- **Gestion départementale** des données électorales
- Peut gérer les commissions départementales et leurs membres
- Peut valider les soumissions des scrutateurs de son département
- Accès en lecture/écriture aux données de son département

### 3. Validateur (`validateur`)
- **Validation** des soumissions des scrutateurs
- Peut approuver ou rejeter les documents, participations et redressements
- Accès en lecture seule aux données à valider
- Portée limitée au département

### 4. Scrutateur (`scrutateur`)
- **Soumission** des données électorales
- Peut créer et modifier ses propres soumissions
- Peut soumettre des documents, participations et redressements
- Accès limité à ses propres données

### 5. Observateur Local (`observateur-local`)
- **Consultation** des données électorales
- Accès en lecture seule aux données de sa zone
- Peut consulter les résultats et documents validés

## Entités Gérées

### 1. Arrondissements (`ARRONDISSEMENT`)
- Gestion des arrondissements
- Permissions : CREATE, READ, UPDATE, DELETE

### 2. Documents d'Arrondissement (`DOCUMENT_ARRONDISSEMENT`)
- Gestion des documents soumis par arrondissement
- Permissions : CREATE, READ, UPDATE, DELETE, VALIDATE, APPROVE, REJECT

### 3. Commissions Départementales (`COMMISSION_DEPARTEMENTALE`)
- Gestion des commissions électorales
- Permissions : CREATE, READ, UPDATE, DELETE

### 4. Membres de Commission (`MEMBRE_COMMISSION`)
- Gestion des membres des commissions
- Permissions : CREATE, READ, UPDATE, DELETE

### 5. Participations Départementales (`PARTICIPATION_DEPARTEMENTALE`)
- Gestion des données de participation électorale
- Permissions : CREATE, READ, UPDATE, DELETE, VALIDATE, APPROVE, REJECT

### 6. Redressements Bureau (`REDRESSEMENT_BUREAU`)
- Gestion des redressements de bureau de vote
- Permissions : CREATE, READ, UPDATE, DELETE, VALIDATE, APPROVE, REJECT

### 7. Redressements Candidat (`REDRESSEMENT_CANDIDAT`)
- Gestion des redressements de candidat
- Permissions : CREATE, READ, UPDATE, DELETE, VALIDATE, APPROVE, REJECT

## Portées d'Accès

### `all` - Accès Global
- Accès à toutes les données sans restriction
- Réservé aux administrateurs

### `region` - Accès Régional
- Accès aux données de la région de l'utilisateur
- Pour les superviseurs régionaux

### `department` - Accès Départemental
- Accès aux données du département de l'utilisateur
- Pour les superviseurs départementaux et validateurs

### `own` - Accès Personnel
- Accès uniquement aux données créées par l'utilisateur
- Pour les scrutateurs et observateurs locaux

## Utilisation

### 1. Hook usePermissions

```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { 
    canAccess, 
    canModify, 
    canCreate, 
    canDelete, 
    canValidate,
    isAdmin,
    isValidator,
    isScrutator,
    isLocalObserver,
    isDepartmentSupervisor
  } = usePermissions();

  // Vérifier les permissions
  if (!canAccess(EntityType.DOCUMENT_ARRONDISSEMENT)) {
    return <div>Accès refusé</div>;
  }

  // Afficher conditionnellement
  return (
    <div>
      {canCreate(EntityType.DOCUMENT_ARRONDISSEMENT) && (
        <button>Créer un document</button>
      )}
      {canValidate(EntityType.DOCUMENT_ARRONDISSEMENT) && (
        <button>Valider</button>
      )}
    </div>
  );
};
```

### 2. Composants de Contrôle d'Accès

```typescript
import { RoleBasedView, RoleBasedButton, AccessDeniedMessage } from './RoleBasedView';

// Afficher conditionnellement du contenu
<RoleBasedView
  entity={EntityType.DOCUMENT_ARRONDISSEMENT}
  action={ActionType.READ}
  fallback={<AccessDeniedMessage entity={EntityType.DOCUMENT_ARRONDISSEMENT} />}
>
  <div>Contenu protégé</div>
</RoleBasedView>

// Bouton avec contrôle d'accès
<RoleBasedButton
  entity={EntityType.DOCUMENT_ARRONDISSEMENT}
  action={ActionType.CREATE}
  onClick={handleCreate}
  className="btn btn-primary"
>
  Créer un document
</RoleBasedButton>
```

### 3. APIs avec Contrôles d'Accès

```typescript
import { roleBasedDocumentArrondissementApi } from '../api/roleBasedArrondissementApi';

// Utiliser les APIs avec contrôles d'accès
const documents = await roleBasedDocumentArrondissementApi.getAll(user);
const document = await roleBasedDocumentArrondissementApi.create(user, data);
```

## Vues Spécialisées par Rôle

### ValidatorView
- Interface de validation pour les validateurs
- Onglets : Documents, Participations, Redressements
- Actions : Approuver, Rejeter avec commentaires

### ScrutatorView
- Interface de soumission pour les scrutateurs
- Onglets : Documents, Participations, Redressements
- Actions : Créer, Modifier, Supprimer (ses propres données)

### ObserverView
- Interface de consultation pour les observateurs
- Onglets : Documents, Participations, Redressements
- Actions : Lecture seule, Téléchargement

### SupervisorView
- Interface de supervision pour les superviseurs départementaux
- Onglets : Vue d'ensemble, Commissions, Documents, Participations, Redressements
- Actions : Gestion complète des données départementales

## Configuration

### 1. Définir les Permissions

Modifiez le fichier `src/types/roles.ts` pour ajuster les permissions :

```typescript
export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  [RoleType.VALIDATEUR]: [
    {
      entity: EntityType.DOCUMENT_ARRONDISSEMENT,
      actions: [ActionType.READ, ActionType.VALIDATE, ActionType.APPROVE, ActionType.REJECT],
      scope: 'department'
    },
    // ... autres permissions
  ],
  // ... autres rôles
};
```

### 2. Ajouter de Nouveaux Rôles

1. Ajoutez le nouveau rôle dans `RoleType` enum
2. Définissez les permissions dans `ROLE_PERMISSIONS`
3. Ajoutez les méthodes de vérification dans `usePermissions`
4. Créez une vue spécialisée si nécessaire

### 3. Ajouter de Nouvelles Entités

1. Ajoutez l'entité dans `EntityType` enum
2. Définissez les permissions pour chaque rôle
3. Créez les APIs avec contrôles d'accès
4. Intégrez dans les composants existants

## Sécurité

### 1. Vérifications Côté Client
- Les contrôles d'accès sont implémentés côté client pour l'UX
- Les composants s'adaptent automatiquement selon les permissions

### 2. Vérifications Côté Serveur
- Les APIs incluent des contrôles d'accès stricts
- Chaque requête est validée selon le rôle de l'utilisateur
- Les tentatives d'accès sont loggées

### 3. Filtrage des Données
- Les données sont filtrées selon la portée de l'utilisateur
- Les utilisateurs ne voient que les données autorisées

## Tests

### 1. Tests des Permissions
```typescript
// Tester les permissions d'un rôle
const userRoles = ['validateur'];
const hasAccess = hasPermission(userRoles, EntityType.DOCUMENT_ARRONDISSEMENT, ActionType.READ);
expect(hasAccess).toBe(true);
```

### 2. Tests des Composants
```typescript
// Tester l'affichage conditionnel
render(
  <RoleBasedView entity={EntityType.DOCUMENT_ARRONDISSEMENT} action={ActionType.READ}>
    <div>Contenu protégé</div>
  </RoleBasedView>
);
```

## Déploiement

### 1. Utiliser l'Application avec Rôles
Remplacez le contenu de `main.tsx` par :
```typescript
import RoleBasedApp from './components/RoleBasedApp';
// ... autres imports

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleBasedApp />
      </QueryClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### 2. Configuration des Utilisateurs
Assurez-vous que les utilisateurs ont les rôles appropriés dans leur profil :
```typescript
const user = {
  roles: [{ code: 1, libelle: 'Validateur' }],
  arrondissementCode: 123,
  departementCode: 45,
  regionCode: 6
};
```

## Maintenance

### 1. Ajout de Nouvelles Fonctionnalités
1. Définissez les permissions nécessaires
2. Créez les APIs avec contrôles d'accès
3. Intégrez dans les composants existants
4. Testez avec différents rôles

### 2. Modification des Permissions
1. Modifiez `ROLE_PERMISSIONS` dans `roles.ts`
2. Mettez à jour les composants si nécessaire
3. Testez les changements

### 3. Débogage
- Utilisez les logs d'accès pour tracer les problèmes
- Vérifiez les permissions dans la console du navigateur
- Testez avec différents rôles utilisateur
