import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mainFile = join(root, 'index.html');
const buildFile = join(root, 'dist', 'index.html');
const html = readFileSync(mainFile, 'utf8');
const builtHtml = readFileSync(buildFile, 'utf8');

function extract(pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, `${label} não encontrado`);
  return match[1];
}

const script = extract(/<script>\s*([\s\S]*?)\s*<\/script>/, 'JavaScript principal');
new Script(script, { filename: 'index.html' });

const servicesSource = extract(/const SERVICES = (\[[\s\S]*?\]);\s*\/\* Perfis legados/, 'Catálogo');
const services = Function(`return (${servicesSource})`)();
const profileSource = extract(/let PROFESSIONALS = (\[[\s\S]*?\]);\s*function iconSvg/, 'Profissionais');
const professionals = Function(`return (${profileSource})`)();
const iconsSource = extract(/const paths=(\{[\s\S]*?\});\s*return `<svg/, 'Ícones');
const icons = Function(`return (${iconsSource})`)();

assert.equal(services.length, 58, 'Número de profissões inesperado');
assert.equal(new Set(services.map(s => s.id)).size, services.length, 'IDs de profissões duplicados');
assert.ok(services.every(s => s.name && s.desc && icons[s.icon] && /^#[\da-f]{6}$/i.test(s.color)), 'Profissão com dados incompletos');
assert.ok(services.some(s => s.id === 'professor'), 'Professor particular ausente');
assert.ok(services.some(s => s.id === 'maquina-lavar'), 'Técnico de máquina de lavar ausente');

const areasSource = extract(/const AREAS = (\[[\s\S]*?\]);/, 'Localidades');
const areas = Function(`return (${areasSource})`)();
assert.ok(areas.includes('Sítio Lucas') && areas.includes('Morro Branco'), 'Localidades principais ausentes');

for (const pro of professionals) {
  assert.ok(services.some(s => s.id === pro.service), `Profissão inexistente para ${pro.name}`);
  assert.match(pro.whatsapp, /^55\d{10,11}$/, `WhatsApp inválido: ${pro.name}`);
  assert.ok(pro.areas.length > 0 && pro.areas.every(a => areas.includes(a)), `Localidade inválida: ${pro.name}`);
  if (pro.photo) {
    assert.match(pro.photo, /^assets\/[\w-]+\.(webp|png|jpg|jpeg)$/);
    assert.ok(existsSync(join(root, 'dist', pro.photo)), `Foto ausente: ${pro.name}`);
  }
}

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
  assert.ok(ids.has(target), `Link interno sem destino: #${target}`);
}
for (const id of ['categories-grid', 'service-search', 'area-filter', 'signup-form', 'dialog-backdrop', 'form-message']) {
  assert.ok(ids.has(id), `Elemento essencial ausente: ${id}`);
}

assert.equal(html, builtHtml, 'Código-fonte e versão de publicação divergentes');
assert.ok(html.includes('aria-label="Anunciar meu serviço"'), 'Botão móvel sem descrição acessível');
assert.ok(html.includes('CONFIG.adminWhatsapp'), 'Integração de cadastro não configurável');
assert.match(html, /adminWhatsapp:\s*'5585997120397'/, 'WhatsApp administrativo não configurado corretamente');
assert.ok(html.includes('Solicitar análise do meu cadastro'), 'Botão do auto-cadastro ausente');
assert.ok(html.includes('https://wa.me/5585997120397'), 'Canal direto de atendimento da agência ausente');
assert.ok(html.includes("loadApprovedProfiles()"), 'Perfis aprovados do banco não são consultados');
assert.ok(html.includes("fetch('/api/cadastros'"), 'Auto-cadastro no banco de dados ausente');
assert.ok(html.includes("[...SERVICES].sort((a,b)=>alphabetical(a.name,b.name))"), 'Profissões do formulário fora da ordenação alfabética');
assert.ok(html.includes('[...AREAS].sort(alphabetical)'), 'Localidades do formulário e filtro fora da ordenação alfabética');
const ptSort = (a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
const firstProfession = services.map(s => s.name).sort(ptSort)[0];
const firstArea = [...areas].sort(ptSort)[0];
assert.equal(firstProfession, 'Ajudante de pedreiro', 'Primeira profissão alfabética inesperada');
assert.equal(firstArea, 'Barra da Sucatinga', 'Primeira localidade alfabética inesperada');

console.log(`AUDITORIA OK — ${services.length} profissões, ${areas.length} localidades, ${professionals.length} perfil(is) real(is), ícones, links internos, JavaScript e ativos.`);
