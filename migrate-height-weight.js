const mysql = require('mysql2/promise');
require('dotenv').config();

async function addHeightWeightColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'paiecashplay_auth',
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log('Ajout des colonnes height_cm et weight_kg...');
    
    await connection.execute(`
      ALTER TABLE user_profiles 
      ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2) NULL COMMENT 'Taille en centimètres',
      ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2) NULL COMMENT 'Poids en kilogrammes'
    `);
    
    console.log('✅ Colonnes ajoutées avec succès !');
    
    // Vérifier que les colonnes ont été ajoutées
    const [rows] = await connection.execute(`
      DESCRIBE user_profiles
    `);
    
    const hasHeight = rows.some(row => row.Field === 'height_cm');
    const hasWeight = rows.some(row => row.Field === 'weight_kg');
    
    console.log(`Height column exists: ${hasHeight}`);
    console.log(`Weight column exists: ${hasWeight}`);
    
  } catch (error) {
    console.error('Erreur lors de la migration:', error.message);
  } finally {
    await connection.end();
  }
}

addHeightWeightColumns();