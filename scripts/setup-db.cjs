/** Quick DB connection test + base table bootstrap */
const fs = require('fs')
const path = require('path')
const { neon } = require('@neondatabase/serverless')

/** 从 .env.local 读取 NEON_DATABASE_URL，避免把连接串硬编码进仓库 */
function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env.local')
  const env = fs.readFileSync(envPath, 'utf-8')
  const match = env.match(/^\s*NEON_DATABASE_URL\s*=\s*(.+)$/m)
  if (!match) throw new Error('NEON_DATABASE_URL not found in .env.local')
  return match[1].trim().replace(/^["']|["']$/g, '')
}

async function main() {
  const sql = neon(loadDatabaseUrl())
  
  const result = await sql`SELECT current_database() as db, version() as ver`
  console.log('DB:', result[0].db)
  console.log('Connected:', result[0].ver.substring(0, 50))
  
  // Create tables
  await sql`
    CREATE TABLE IF NOT EXISTS characters (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      style TEXT DEFAULT 'watercolor',
      ref_seed INTEGER NOT NULL,
      prompt_template TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: characters')
  
  await sql`
    CREATE TABLE IF NOT EXISTS stories (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT[] NOT NULL,
      age_group TEXT NOT NULL,
      theme TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: stories')
  
  await sql`
    CREATE TABLE IF NOT EXISTS books (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      character_id UUID REFERENCES characters(id),
      story_id UUID REFERENCES stories(id),
      page_image_urls TEXT[],
      status TEXT DEFAULT 'draft',
      format TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  console.log('✓ Table: books')
  console.log('\n✅ Database configured successfully!')
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
