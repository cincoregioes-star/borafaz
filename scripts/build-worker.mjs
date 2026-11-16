import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const admin = readFileSync(resolve(root, 'admin.html'), 'utf8');
const photo = readFileSync(resolve(root, 'assets/francisca.webp')).toString('base64');
const source = readFileSync(resolve(root, 'worker/index.js'), 'utf8');
const servicesBlock = html.match(/const SERVICES = \[([\s\S]*?)\];/);
const areasBlock = html.match(/const AREAS = \[([^\n]+)\];/);
assert.ok(servicesBlock && areasBlock, 'Catálogo não encontrado');
const services = [...servicesBlock[1].matchAll(/\{id:'([^']+)'/g)].map(match => match[1]);
const labels = [...servicesBlock[1].matchAll(/\{id:'([^']+)',name:'([^']+)'/g)].map(match => ({ id: match[1], name: match[2] }));
const areas = [...areasBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
assert.equal(services.length, 58, 'Catálogo de profissões incompleto');
assert.equal(labels.length, 58, 'Rótulos de profissões incompletos');
assert.equal(areas.length, 13, 'Catálogo de localidades incompleto');

let output = source;
const values = {
  '__BORAFAZ_PAGE__': html,
  '__BORAFAZ_ADMIN__': admin,
  '__BORAFAZ_FRANCISCA__': photo,
  '__BORAFAZ_SERVICES__': services,
  '__BORAFAZ_SERVICE_LABELS__': labels,
  '__BORAFAZ_AREAS__': areas,
};
for (const [tag, value] of Object.entries(values)) {
  const marker = `'${tag}'`;
  assert.ok(output.includes(marker), `Marcador de build ausente: ${tag}`);
  output = output.replace(marker, JSON.stringify(value));
}
mkdirSync(resolve(root, 'dist/server'), { recursive: true });
writeFileSync(resolve(root, 'dist/server/index.js'), output);
console.log('Worker BORAFAZ gerado com catálogo, painel e fotografia.');
