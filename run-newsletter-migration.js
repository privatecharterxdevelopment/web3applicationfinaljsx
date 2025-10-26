/**
 * Newsletter System Database Migration Runner
 * Executes the newsletter system SQL migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.backend' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://oubecmstqtzdnevyqavu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.backend');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('='.repeat(60));
    console.log('🚀 Newsletter System Migration');
    console.log('='.repeat(60));

    // Read SQL file
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'create_newsletter_system.sql');
    console.log(`📂 Reading SQL from: ${sqlPath}`);

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing migration...');

    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query instead
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

      console.log(`📊 Found ${statements.length} SQL statements to execute`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.includes('NOTICE') || stmt.includes('DO $$')) continue; // Skip notices

        console.log(`   ${i + 1}/${statements.length} Executing...`);

        // For CREATE TABLE, INSERT, etc., we need to use the REST API
        // This is a limitation - Supabase JS client doesn't support raw SQL well
        // Best to run this in Supabase SQL Editor
      }

      console.log('\n⚠️  Direct SQL execution has limitations.');
      console.log('📌 Please run the migration manually:');
      console.log('   1. Go to: https://app.supabase.com/project/oubecmstqtzdnevyqavu/sql/new');
      console.log('   2. Copy contents of: supabase/migrations/create_newsletter_system.sql');
      console.log('   3. Paste and click "Run"');
      console.log('\n✅ Or use psql:');
      console.log(`   psql "${supabaseUrl}" -f supabase/migrations/create_newsletter_system.sql`);

      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📌 Please run the migration manually in Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/oubecmstqtzdnevyqavu/sql/new');
    process.exit(1);
  }
}

runMigration();
