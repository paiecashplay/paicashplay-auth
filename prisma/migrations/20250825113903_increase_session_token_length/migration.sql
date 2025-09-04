/*
  Warnings:

  - You are about to drop the `user_consents` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider_id,provider_user_id]` on the table `social_accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `social_accounts_provider_id_idx` ON `social_accounts`;

-- DropIndex
DROP INDEX `social_accounts_provider_user_id_idx` ON `social_accounts`;

-- AlterTable
ALTER TABLE `access_tokens` MODIFY `token_hash` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `admin_users` ADD COLUMN `allowed_services` JSON NULL,
    ADD COLUMN `role` ENUM('super_admin', 'admin', 'service_admin') NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE `authorization_codes` MODIFY `code` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `email_verifications` MODIFY `token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `password_resets` MODIFY `token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `rate_limit_logs` MODIFY `key` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `token_hash` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `user_profiles` ADD COLUMN `height_cm` DOUBLE NULL,
    ADD COLUMN `weight_kg` DOUBLE NULL;

-- AlterTable
ALTER TABLE `user_sessions` MODIFY `session_token` VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `user_type` ENUM('donor', 'federation', 'club', 'player', 'company', 'affiliate', 'academy', 'school', 'association') NOT NULL;

-- DropTable
DROP TABLE `user_consents`;

-- CreateTable
CREATE TABLE `oauth_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL,
    `redirect_uri` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `social_accounts_provider_id_provider_user_id_key` ON `social_accounts`(`provider_id`, `provider_user_id`);
