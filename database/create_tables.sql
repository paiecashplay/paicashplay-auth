-- Création manuelle des tables principales
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(191) PRIMARY KEY,
  email VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  user_type ENUM('donor', 'federation', 'club', 'player', 'company') NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  login_attempts INT DEFAULT 0,
  locked_until DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) UNIQUE NOT NULL,
  first_name VARCHAR(191) NOT NULL,
  last_name VARCHAR(191) NOT NULL,
  phone VARCHAR(191) NULL,
  country VARCHAR(191) NULL,
  language VARCHAR(191) DEFAULT 'fr',
  avatar_url VARCHAR(191) NULL,
  is_partner BOOLEAN DEFAULT FALSE,
  metadata JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(191) PRIMARY KEY,
  username VARCHAR(191) UNIQUE NOT NULL,
  password_hash VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL,
  full_name VARCHAR(191) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  session_token VARCHAR(191) UNIQUE NOT NULL,
  ip_address VARCHAR(191) NULL,
  user_agent TEXT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS oauth_clients (
  id VARCHAR(191) PRIMARY KEY,
  client_id VARCHAR(191) UNIQUE NOT NULL,
  client_secret VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  redirect_uris JSON NOT NULL,
  allowed_scopes JSON NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_consents (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  client_id VARCHAR(191) NOT NULL,
  scopes JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY user_client_unique (user_id, client_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(191) PRIMARY KEY,
  user_id VARCHAR(191) NULL,
  admin_id VARCHAR(191) NULL,
  action VARCHAR(191) NOT NULL,
  resource_type VARCHAR(191) NOT NULL,
  resource_id VARCHAR(191) NULL,
  old_values JSON NULL,
  new_values JSON NULL,
  ip_address VARCHAR(191) NULL,
  user_agent TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Insérer un admin par défaut
INSERT IGNORE INTO admin_users (id, username, password_hash, email, full_name) 
VALUES (
  'admin_default', 
  'admin', 
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXwtGTbk5jPG', -- password: admin123
  'admin@paiecashplay.com', 
  'Administrateur'
);