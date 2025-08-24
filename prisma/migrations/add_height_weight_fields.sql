-- Migration pour ajouter les champs taille et poids
ALTER TABLE user_profiles 
ADD COLUMN height_cm DECIMAL(5,2) NULL COMMENT 'Taille en centimètres',
ADD COLUMN weight_kg DECIMAL(5,2) NULL COMMENT 'Poids en kilogrammes';