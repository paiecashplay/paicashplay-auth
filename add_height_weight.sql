-- Ajouter les colonnes height et weight à la table user_profiles
USE paiecashplay_auth;

ALTER TABLE user_profiles 
ADD COLUMN height_cm DECIMAL(5,2) NULL COMMENT 'Taille en centimètres' AFTER avatar_url,
ADD COLUMN weight_kg DECIMAL(5,2) NULL COMMENT 'Poids en kilogrammes' AFTER height_cm;