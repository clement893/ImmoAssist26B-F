# Correction : contrainte unique sur real_estate_contacts.user_id

## Problème

Les **vendeurs et acheteurs** indiqués à Léa ne s’affichent pas sur la fiche transaction.

**Cause :** la base impose une contrainte d’unicité sur `real_estate_contacts.user_id`  
(`duplicate key value violates unique constraint "ix_real_estate_contacts_user_id"`).  
Un utilisateur ne peut avoir qu’un seul contact ; dès qu’on ajoute un 2ᵉ (ex. vendeur puis acheteur), l’INSERT échoue → rollback → rien n’est enregistré.

## Solution automatique (recommandée)

À chaque déploiement, le script `scripts/ensure_contacts_constraint_dropped.py` est exécuté au démarrage (voir `entrypoint.sh`). **Un simple push et redéploiement suffit** : la contrainte est supprimée automatiquement si besoin.

## Solution manuelle (si besoin)

Exécuter le SQL suivant **une seule fois** sur la base (Railway → Database → Query, ou `psql`).

```sql
-- Supprimer la contrainte unique sur user_id (autorise plusieurs contacts par utilisateur)
ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS uq_real_estate_contacts_user_id;
ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS ix_real_estate_contacts_user_id;
DROP INDEX IF EXISTS ix_real_estate_contacts_user_id;
```

Après exécution, redéployer ou redémarrer l’app n’est pas nécessaire : les prochains ajouts de vendeurs/acheteurs via Léa fonctionneront.

## Vérification

```sql
-- Aucune contrainte unique sur user_id ne doit rester
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'real_estate_contacts'::regclass
  AND contype = 'u';
-- Résultat attendu : 0 lignes (ou aucune ligne avec user_id seul)
```

## Migrations Alembic

La migration **050_drop_real_estate_contacts_user_id_unique_ix** fait la même chose. Si les migrations sont bloquées (ex. 046 échoue sur `uq_...` ou 047 sur `version_num` trop long), exécuter le SQL ci‑dessus débloque l’app tout de suite. Quand la chaîne de migrations sera à jour, la 050 ne fera plus rien (IF EXISTS).

## Références

- Logs Railway : `duplicate key value violates unique constraint "ix_real_estate_contacts_user_id"`
- Migration : `backend/alembic/versions/050_drop_real_estate_contacts_user_id_unique_ix.py`
