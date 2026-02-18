const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');

function run(cmd, cwd = root) {
  console.log('>', cmd);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

const envPath = path.join(root, '.env');
const defaultJwtSecret = crypto.randomBytes(32).toString('base64').slice(0, 48);

function ensureEnv() {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }
  if (!content.includes('DATABASE_URL')) {
    content += 'DATABASE_URL="file:./dev.db"\n';
  }
  if (!content.includes('JWT_SECRET')) {
    content += `JWT_SECRET="${defaultJwtSecret}"\n`;
  }
  fs.writeFileSync(envPath, content.trimEnd() + '\n', 'utf8');
  console.log('.env ok (DATABASE_URL + JWT_SECRET)');
}

ensureEnv();

// Instalar dependências na primeira vez (legacy-peer-deps evita conflito React/Tremor)
const nodeModules = path.join(root, 'node_modules');
if (!fs.existsSync(nodeModules) || !fs.existsSync(path.join(nodeModules, 'jose'))) {
  run('npm install --legacy-peer-deps');
} else {
  console.log('Dependências ok');
}

function runOptional(cmd, cwd = root) {
  try {
    run(cmd, cwd);
  } catch (e) {
    console.warn('Aviso:', cmd, 'falhou.', e.message || e);
  }
}

runOptional('npx prisma generate');
runOptional('npx prisma db push');
runOptional('npx prisma db seed');

console.log('\n=== Pronto ===');
console.log('Acesse no navegador: http://localhost:3000');
console.log('Login: admin@techfala.com  |  Senha: admin123\n');
