#!/usr/bin/env node

/**
 * Script de migration pour ajouter le type "company" et le champ "isPartner"
 * Usage: node scripts/migrate-company-type.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'paiecashplay_auth'
    });

    console.log('✅ Connexion à la base de données établie');

    // 1. Vérifier si la colonne is_partner existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_profiles' AND COLUMN_NAME = 'is_partner'
    `, [process.env.DB_NAME || 'paiecashplay_auth']);

    if (columns.length === 0) {
      // Ajouter la colonne is_partner
      await connection.execute(`
        ALTER TABLE user_profiles 
        ADD COLUMN is_partner BOOLEAN NOT NULL DEFAULT FALSE
      `);
      console.log('✅ Colonne is_partner ajoutée à user_profiles');
    } else {
      console.log('ℹ️  Colonne is_partner existe déjà');
    }

    // 2. Vérifier et mettre à jour l'enum UserType
    const [enumInfo] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_type'
    `, [process.env.DB_NAME || 'paiecashplay_auth']);

    if (enumInfo.length > 0) {
      const currentEnum = enumInfo[0].COLUMN_TYPE;
      
      if (!currentEnum.includes('company')) {
        // Mettre à jour l'enum pour inclure 'company'
        await connection.execute(`
          ALTER TABLE users 
          MODIFY COLUMN user_type ENUM('donor', 'federation', 'club', 'player', 'company') NOT NULL
        `);
        console.log('✅ Enum UserType mis à jour avec le type "company"');
      } else {
        console.log('ℹ️  Type "company" existe déjà dans l\'enum');
      }
    }

    // 3. Vérifier les données existantes
    const [userCount] = await connection.execute(`
      SELECT user_type, COUNT(*) as count 
      FROM users 
      GROUP BY user_type
    `);

    console.log('\n📊 Répartition actuelle des types d\'utilisateurs:');
    userCount.forEach(row => {
      console.log(`   ${row.user_type}: ${row.count} utilisateurs`);
    });

    console.log('\n✅ Migration terminée avec succès!');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Redémarrer l\'application');
    console.log('   2. Tester la création d\'un compte société');
    console.log('   3. Vérifier l\'interface d\'administration');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Exécuter la migration
runMigration();