import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { default: app } = await import('../dist/server/index.js');
const db = new DatabaseSync(':memory:');
const migration = readFileSync(resolve(root, 'drizzle/0000_borafaz.sql'), 'utf8');
for (const statement of migration.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean)) db.exec(statement);

const photos = new Map();
const env = {
  BORAFAZ_ADMIN_EMAIL: 'admin@example.test',
  DB: {
    prepare(query) {
      const stmt = db.prepare(query);
      return {
        bind(...params) {
          return {
            first: async () => stmt.get(...params),
            all: async () => ({ results: stmt.all(...params) }),
            run: async () => stmt.run(...params),
          };
        },
        first: async () => stmt.get(),
        all: async () => ({ results: stmt.all() }),
        run: async () => stmt.run(),
      };
    },
  },
  BUCKET: {
    async put(key, body, options) { photos.set(key, { body, httpMetadata: options.httpMetadata }); },
    async get(key) { return photos.get(key) || null; },
    async delete(key) { photos.delete(key); },
  },
};

const host = 'https://borafaz.test';
const adminHeaders = {
  'oai-authenticated-user-id': 'usuario-site-confiavel',
  'oai-authenticated-user-email': 'admin@example.test',
};
async function request(path, options = {}) {
  return app.fetch(new Request(host + path, options), env);
}
async function json(path, options = {}) {
  const response = await request(path, options);
  return { status: response.status, data: await response.json() };
}
const page = await request('/');
assert.equal(page.status, 200);
assert.match(await page.text(), /Solicitar análise do meu cadastro/);
assert.equal((await request('/assets/francisca.webp')).status, 200);
const adminPage = await request('/admin');
assert.equal(adminPage.status, 200);
assert.match(await adminPage.text(), /Enviar mensagem ao profissional/);
assert.equal((await json('/api/admin/cadastros')).status, 403, 'API administrativa pública');
assert.equal((await json('/api/admin/cadastros', { headers: { 'oai-authenticated-user-email': 'admin@example.test' } })).status, 403, 'Acesso sem identidade aceito');
assert.equal((await json('/api/profissionais')).data.professionals.length, 0, 'Novo cadastro já publicado');

const form = new FormData();
const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
form.set('name', 'Profissional de Teste');
form.set('phone', '(85) 99999-1111');
form.set('service', 'pedreiro');
form.set('area', 'Sítio Lucas');
form.set('regions', 'Sítio Lucas, Centro de Beberibe');
form.set('description', 'Reboco, paredes e reparos residenciais.');
form.set('since', '2019');
form.set('consent', 'yes');
form.set('photo', new File([pngBytes], 'pendente.png', { type: 'image/png' }));
const forbidden = await json('/api/cadastros', { method: 'POST', body: form });
assert.equal(forbidden.status, 403, 'Cadastro sem origem aceito');
const created = await json('/api/cadastros', { method: 'POST', headers: { origin: host }, body: form });
assert.equal(created.status, 201, JSON.stringify(created.data));
assert.match(created.data.message, /entrará em contato pelo WhatsApp informado/);
assert.match(created.data.message, /Não realize pagamentos antes/);
const id = created.data.id;
assert.match(id, /^[0-9a-f-]{36}$/);
assert.equal((await request(`/api/foto/${id}`)).status, 404, 'Fotografia pendente ficou pública');
assert.equal((await request(`/api/admin/foto/${id}`, { headers: adminHeaders })).status, 200, 'Fotografia pendente não visível ao administrador');
assert.equal((await json('/api/profissionais')).data.professionals.length, 0, 'Cadastro pendente vazou no catálogo');
const pending = await json('/api/admin/cadastros', { headers: adminHeaders });
assert.equal(pending.status, 200);
assert.equal(pending.data.professionals.length, 1);
assert.equal(pending.data.professionals[0].status, 'pending');
const approveBeforePayment = await json(`/api/admin/cadastros/${id}/acao`, {
  method: 'POST', headers: { ...adminHeaders, origin: host, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve' }),
});
assert.equal(approveBeforePayment.status, 400, 'Aprovação sem mensalidade confirmada');
const payment = await json(`/api/admin/cadastros/${id}/acao`, {
  method: 'POST', headers: { ...adminHeaders, origin: host, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'confirm-payment' }),
});
assert.equal(payment.status, 200);
assert.equal((await json('/api/profissionais')).data.professionals.length, 0, 'Pagamento liberou perfil sem aprovação');
const approve = await json(`/api/admin/cadastros/${id}/acao`, {
  method: 'POST', headers: { ...adminHeaders, origin: host, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'approve' }),
});
assert.equal(approve.status, 200);
const publicResult = await json('/api/profissionais');
assert.equal(publicResult.data.professionals.length, 1);
assert.equal(publicResult.data.professionals[0].name, 'Profissional de Teste');
assert.equal(publicResult.data.professionals[0].whatsapp, '5585999991111');

const photoForm = new FormData();
photoForm.set('photo', new File([pngBytes], 'teste.png', { type: 'image/png' }));
const photoUpload = await json(`/api/admin/cadastros/${id}/foto`, { method: 'POST', headers: { ...adminHeaders, origin: host }, body: photoForm });
assert.equal(photoUpload.status, 200);
assert.equal((await request(`/api/foto/${id}`)).status, 200);
assert.equal((await request(`/api/admin/foto/${id}`, { headers: adminHeaders })).status, 200);
const suspension = await json(`/api/admin/cadastros/${id}/acao`, {
  method: 'POST', headers: { ...adminHeaders, origin: host, 'content-type': 'application/json' }, body: JSON.stringify({ action: 'suspend' }),
});
assert.equal(suspension.status, 200);
assert.equal((await json('/api/profissionais')).data.professionals.length, 0, 'Suspensão não retirou perfil público');
assert.equal((await request(`/api/foto/${id}`)).status, 404, 'Foto de perfil suspenso ainda pública');

db.close();
console.log('TESTES DO WORKER OK — formulário, D1, aprovação, Pix manual, fotos privadas, catálogo e suspensão.');
