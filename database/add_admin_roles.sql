-- Add role and services columns to admin_users table
ALTER TABLE admin_users 
ADD COLUMN role ENUM('super_admin', 'admin', 'service_admin') DEFAULT 'admin' AFTER full_name,
ADD COLUMN allowed_services JSON NULL AFTER role;

-- Update existing admin to super_admin
UPDATE admin_users SET role = 'super_admin' WHERE username = 'admin';