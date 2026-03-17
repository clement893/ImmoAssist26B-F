-- Fix: allow multiple real_estate_contacts per user (sellers/buyers on transaction).
-- Run once on production DB (Railway Query or psql).
-- Idempotent: safe to run even if constraint was already removed.

ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS uq_real_estate_contacts_user_id;
ALTER TABLE real_estate_contacts DROP CONSTRAINT IF EXISTS ix_real_estate_contacts_user_id;
DROP INDEX IF EXISTS ix_real_estate_contacts_user_id;
