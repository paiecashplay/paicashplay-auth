-- Fix UserConsent foreign key relation to reference clientId instead of id
-- This migration updates the foreign key constraint

-- Drop existing foreign key constraint if it exists
ALTER TABLE user_consents DROP FOREIGN KEY IF EXISTS user_consents_client_id_fkey;

-- Add correct foreign key constraint
ALTER TABLE user_consents 
ADD CONSTRAINT user_consents_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE;