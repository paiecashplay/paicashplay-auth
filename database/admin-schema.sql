-- Extension du schéma pour l'administration

-- Table des administrateurs
CREATE TABLE admin_users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
);

-- Table des configurations système
CREATE TABLE system_configs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id),
    INDEX idx_config_key (config_key)
);

-- Table des logs d'administration
CREATE TABLE admin_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- Insérer l'administrateur par défaut
INSERT INTO admin_users (username, password_hash, email, full_name) VALUES 
('admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/hMxDGKKxG', 'admin@paiecashplay.com', 'Administrateur Principal');

-- Configurations SMTP par défaut
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('smtp_host', 'smtp.gmail.com', 'string', 'Serveur SMTP'),
('smtp_port', '587', 'number', 'Port SMTP'),
('smtp_user', '', 'string', 'Utilisateur SMTP'),
('smtp_password', '', 'string', 'Mot de passe SMTP'),
('smtp_secure', 'false', 'boolean', 'Connexion sécurisée SMTP'),
('from_email', 'noreply@paiecashplay.com', 'string', 'Email expéditeur'),
('from_name', 'PaieCashPlay Fondation', 'string', 'Nom expéditeur'),
('jwt_secret', '', 'string', 'Clé secrète JWT'),
('issuer', 'https://auth.paiecashplay.com', 'string', 'Émetteur JWT'),
('session_duration', '7', 'number', 'Durée session (jours)'),
('max_login_attempts', '5', 'number', 'Tentatives de connexion max'),
('password_min_length', '8', 'number', 'Longueur minimale mot de passe');