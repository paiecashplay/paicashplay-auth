-- Migration pour ajouter le type "company" et le champ "isPartner"

-- Ajouter la nouvelle valeur à l'enum UserType
ALTER TABLE `users` MODIFY COLUMN `user_type` ENUM('donor', 'federation', 'club', 'player', 'company') NOT NULL;

-- Ajouter le champ isPartner à la table user_profiles
ALTER TABLE `user_profiles` ADD COLUMN `is_partner` BOOLEAN NOT NULL DEFAULT FALSE;