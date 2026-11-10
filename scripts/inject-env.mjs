import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const prodEnvPath = path.resolve(rootDir, 'src/environments/environment.prod.ts');
const localEnvPath = path.resolve(rootDir, '.env');

// Parse local .env if present (for local testing)
if (fs.existsSync(localEnvPath)) {
  const envContent = fs.readFileSync(localEnvPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

if (!fs.existsSync(prodEnvPath)) {
  console.error(`[inject-env] Error: ${prodEnvPath} not found.`);
  process.exit(1);
}

let content = fs.readFileSync(prodEnvPath, 'utf8');

const replacements = {
  __FIREBASE_API_KEY__: process.env.FIREBASE_API_KEY,
  __FIREBASE_AUTH_DOMAIN__: process.env.FIREBASE_AUTH_DOMAIN || 'meraki-public.firebaseapp.com',
  __FIREBASE_PROJECT_ID__: process.env.FIREBASE_PROJECT_ID || 'meraki-public',
  __FIREBASE_APP_ID__: process.env.FIREBASE_APP_ID,
  __FIREBASE_MEASUREMENT_ID__: process.env.FIREBASE_MEASUREMENT_ID,
  __RECAPTCHA_SITE_KEY__: process.env.RECAPTCHA_SITE_KEY
};

let replacedCount = 0;
for (const [placeholder, value] of Object.entries(replacements)) {
  if (value) {
    if (content.includes(placeholder)) {
      content = content.replaceAll(placeholder, value);
      replacedCount++;
    }
  } else {
    console.warn(`[inject-env] Warning: No env value for ${placeholder}`);
  }
}

fs.writeFileSync(prodEnvPath, content, 'utf8');
console.log(`[inject-env] Successfully injected ${replacedCount} secrets into environment.prod.ts`);
