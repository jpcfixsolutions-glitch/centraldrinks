import { writeFileSync } from 'node:fs';

const apiUrl = process.env.VITE_API_URL?.trim().replace(/\/$/, '');

if (process.env.VERCEL === '1' && !apiUrl) {
  console.error(
    '\n[centraldrinks] Falta VITE_API_URL en el proyecto frontend de Vercel.\n' +
      'Ejemplo: https://tu-backend.vercel.app/api\n'
  );
  process.exit(1);
}

if (!apiUrl) {
  console.log('[centraldrinks] VITE_API_URL no definida; build local sin proxy de Vercel.');
  process.exit(0);
}

const backendOrigin = apiUrl.replace(/\/api$/i, '');

const vercelConfig = {
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${backendOrigin}/api/:path*`,
    },
  ],
};

writeFileSync('vercel.json', `${JSON.stringify(vercelConfig, null, 2)}\n`);
console.log(`[centraldrinks] Proxy /api -> ${backendOrigin}/api`);
