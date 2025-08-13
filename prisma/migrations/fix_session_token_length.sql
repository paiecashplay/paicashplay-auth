-- Migration pour corriger la longueur de la colonne session_token
ALTER TABLE user_sessions MODIFY COLUMN session_token VARCHAR(500) NOT NULL;