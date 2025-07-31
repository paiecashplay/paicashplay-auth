-- Création de la table social_accounts pour l'authentification sociale
CREATE TABLE IF NOT EXISTS social_accounts (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  provider_id VARCHAR(191) NOT NULL,
  provider_user_id VARCHAR(100) NOT NULL,
  email VARCHAR(191) NULL,
  name VARCHAR(191) NULL,
  avatar VARCHAR(191) NULL,
  access_token TEXT NULL,
  refresh_token TEXT NULL,
  expires_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY provider_user_unique (provider_id, provider_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES identity_providers(id) ON DELETE CASCADE
);

-- Ajout de quelques providers par défaut
INSERT IGNORE INTO identity_providers (id, name, display_name, type, client_id, client_secret, is_enabled) VALUES
('google_provider', 'google', 'Google', 'google', 'your_google_client_id', 'your_google_client_secret', TRUE),
('facebook_provider', 'facebook', 'Facebook', 'facebook', 'your_facebook_client_id', 'your_facebook_client_secret', TRUE),
('linkedin_provider', 'linkedin', 'LinkedIn', 'linkedin', 'your_linkedin_client_id', 'your_linkedin_client_secret', TRUE);