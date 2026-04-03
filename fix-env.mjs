import fs from 'fs';

const json = JSON.parse(fs.readFileSync('docs/healingsoil-24d17e90de5d.json', 'utf8'));
const key = json.private_key;

let env = fs.readFileSync('.env.local', 'utf8');
env = env.replace(/GOOGLE_PRIVATE_KEY="[\s\S]*?"/, `GOOGLE_PRIVATE_KEY="${key}"`);

fs.writeFileSync('.env.local', env);
console.log('✅ .env.local updated with clean multiline key');
