import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

try {
  new URL(supabaseUrl);
} catch (error) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}. It should start with https://`);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BASE_URL = 'https://smartgen-educ.com';
const today = new Date().toISOString().split('T')[0];

const staticRoutes = [
  '/', '/about', '/teachers', '/teacher-register', '/teacher-login',
  '/admin', '/admin-dashboard', '/teacher-dashboard', '/edit-teacher-profile',
  '/login', '/register'
];

async function generateSitemap() {
  const { data: teachers, error } = await supabase.from('teachers').select('id');

  if (error) {
    console.error('❌ Error fetching teacher IDs:', error.message);
    process.exit(1);
  }

  const urls = staticRoutes.map(route => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
    <priority>${route === '/' ? '1.0' : '0.7'}</priority>
  </url>`);

  teachers?.forEach(({ id }) => {
    urls.push(`
  <url>
    <loc>${BASE_URL}/teachers/${id}</loc>
    <lastmod>${today}</lastmod>
    <priority>0.7</priority>
  </url>`);
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  try {
    fs.writeFileSync('public/sitemap.xml', sitemap.trim());
    console.log('✅ sitemap.xml generated successfully!');
  } catch (err) {
    console.error('❌ Failed to write sitemap.xml:', err.message);
    process.exit(1);
  }
}

generateSitemap();
