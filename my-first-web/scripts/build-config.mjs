#!/usr/bin/env node
/**
 * Đọc .env → sinh js/config.js (client-safe) + cập nhật preconnect Supabase trong HTML.
 * Chạy trước deploy/local: npm run build:config
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function requireKeys(env, keys) {
  const missing = keys.filter((k) => !env[k]?.trim());
  if (missing.length) {
    console.error('❌ Thiếu biến trong .env:', missing.join(', '));
    console.error('   Sao chép .env.example → .env rồi điền giá trị.');
    process.exit(1);
  }
}

if (!existsSync(envPath)) {
  console.error('❌ Không tìm thấy .env tại:', envPath);
  console.error('   cp .env.example .env  (rồi điền secrets)');
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));

requireKeys(env, [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_LEADS_TABLE',
  'PAYMENT_BANK_ID',
  'PAYMENT_ACCOUNT_NO',
  'PAYMENT_ACCOUNT_NAME',
  'ADMIN_PASSWORD',
]);

const config = {
  supabaseUrl: env.SUPABASE_URL.trim().replace(/\/$/, ''),
  supabaseAnonKey: env.SUPABASE_ANON_KEY.trim(),
  supabaseLeadsTable: env.SUPABASE_LEADS_TABLE.trim(),
  payment: {
    bankId: env.PAYMENT_BANK_ID.trim(),
    accountNo: env.PAYMENT_ACCOUNT_NO.trim(),
    accountName: env.PAYMENT_ACCOUNT_NAME.trim(),
  },
  adminPassword: env.ADMIN_PASSWORD.trim(),
  links: {
    zalo: (env.ZALO_LINK || 'https://zalo.me/moawmoaws').trim(),
    waitlistForm: (env.WAITLIST_FORM_URL || '').trim(),
  },
};

const banner = `/* AUTO-GENERATED — không sửa tay. Nguồn: .env + npm run build:config */\n`;
const body = `${banner}window.MOAW_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
writeFileSync(join(root, 'js', 'config.js'), body, 'utf8');
console.log('✅ Đã tạo js/config.js');

const origin = config.supabaseUrl;
for (const file of ['product-detail.html']) {
  const p = join(root, file);
  if (!existsSync(p)) continue;
  let html = readFileSync(p, 'utf8');
  const next = html.replace(
    /<link rel="preconnect" href="https:\/\/[^"]+\.supabase\.co" crossorigin>/,
    `<link rel="preconnect" href="${origin}" crossorigin>`
  );
  if (next !== html) {
    writeFileSync(p, next, 'utf8');
    console.log(`✅ Đã cập nhật preconnect Supabase trong ${file}`);
  }
}

if (env.RESEND_API_KEY?.trim()) {
  console.log('ℹ️  RESEND_API_KEY có trong .env — chỉ dùng trên Supabase Edge Function (không đưa vào config.js).');
}
