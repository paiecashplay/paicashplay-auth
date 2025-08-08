CREATE TABLE IF NOT EXISTS oauth_sessions (
  id VARCHAR(30) PRIMARY KEY,
  client_id VARCHAR(30) NOT NULL,
  redirect_uri TEXT NOT NULL,
  scope VARCHAR(255),
  state VARCHAR(255),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_id (client_id),
  INDEX idx_expires_at (expires_at)
);