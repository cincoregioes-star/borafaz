/* BORAFAZ — Worker de catálogo, cadastro e moderação.
   Os marcadores abaixo são substituídos pelo script de compilação.
   Os contatos recebidos não são públicos até a aprovação administrativa. */
const PAGE_HTML = '__BORAFAZ_PAGE__';
const ADMIN_HTML = '__BORAFAZ_ADMIN__';
const FRANCISCA_IMAGE_BASE64 = '__BORAFAZ_FRANCISCA__';
const ALLOWED_SERVICES = '__BORAFAZ_SERVICES__';
const ALLOWED_AREAS = '__BORAFAZ_AREAS__';
const SERVICE_LABELS = '__BORAFAZ_SERVICE_LABELS__';

const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function reply(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', ...headers },
  });
}
function html(body, admin = false) {
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8', 'cache-control': admin ? 'no-store' : 'no-cache',
      'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin',
      'x-frame-options': 'DENY',
    },
  });
}
function isAdmin(req, env) {
  // Headers de identidade emitidos pelo despacho autenticado do Sites.
  const allowed = String(env.BORAFAZ_ADMIN_EMAIL || '').trim().toLowerCase();
  return Boolean(allowed && req.headers.get('oai-authenticated-user-id')) &&
    req.headers.get('oai-authenticated-user-email')?.trim().toLowerCase() === allowed;
}
function noCache(error, status = 400) { return reply({ ok: false, error }, status); }
function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return origin != null && origin === new URL(request.url).origin;
}
function inputText(value, max, required = true) {
  if (typeof value !== 'string') throw new Error('Dados inválidos.');
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if ((required && !cleaned) || cleaned.length > max) throw new Error('Preencha corretamente todos os campos.');
  return cleaned;
}
function phone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const normal = digits.length === 10 || digits.length === 11 ? '55' + digits : digits;
  if (!/^55\d{10,11}$/.test(normal)) throw new Error('WhatsApp inválido. Informe o DDD.');
  return normal;
}
function checkForm(obj) {
  const name = inputText(obj.name, 90);
  const whatsapp = phone(obj.phone || obj.whatsapp);
  const service = inputText(obj.service, 60);
  const location = inputText(obj.area || obj.location, 90);
  const areasText = inputText(obj.regions || obj.areas, 200);
  const description = inputText(obj.description, 600);
  if (!ALLOWED_SERVICES.includes(service)) throw new Error('Profissão não encontrada no catálogo.');
  if (!ALLOWED_AREAS.includes(location)) throw new Error('Localidade não encontrada.');
  const sinceRaw = String(obj.since || obj.experience_since || '').trim();
  const experience_since = sinceRaw ? Number(sinceRaw) : null;
  const year = new Date().getUTCFullYear();
  if (experience_since != null && (!Number.isInteger(experience_since) || experience_since < 1950 || experience_since > year)) {
    throw new Error('Informe um ano de experiência válido.');
  }
  return { name, whatsapp, service, location, areasText, description, experience_since };
}
function isImageHeader(bytes, mime) {
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (mime === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}
async function uploadPhoto(file, env, id) {
  if (!(file instanceof File) || !file.size) return null;
  if (!env.BUCKET) throw new Error('Envio de fotos indisponível. Tente novamente sem a foto.');
  if (file.size > MAX_PHOTO_BYTES) throw new Error('A foto deve ter no máximo 3 MB.');
  if (!PHOTO_TYPES.has(file.type)) throw new Error('Escolha uma foto JPG, PNG ou WebP.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isImageHeader(bytes, file.type)) throw new Error('O arquivo selecionado não parece ser uma imagem válida.');
  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const key = `cadastros/${id}.${ext}`;
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
  return key;
}
function photoType(key) {
  return key?.endsWith('.png') ? 'image/png' : key?.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
}
async function getImage(env, key) {
  if (!key || !env.BUCKET) return noCache('Foto indisponível.', 404);
  const photo = await env.BUCKET.get(key);
  if (!photo) return noCache('Foto não encontrada.', 404);
  return new Response(photo.body, {
    headers: { 'content-type': photo.httpMetadata?.contentType || photoType(key), 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
function rowData(row) {
  return {
    id: row.id, name: row.name, whatsapp: row.whatsapp, service: row.service,
    location: row.location, areas: row.areas, description: row.description,
    experienceSince: row.experience_since, status: row.status, paymentStatus: row.payment_status,
    paidUntil: row.paid_until, photo: row.photo_key ? `/api/foto/${row.id}` : '',
    hasPhoto: Boolean(row.photo_key), createdAt: row.created_at, reviewedAt: row.reviewed_at,
  };
}
function rowPublic(row) {
  const r = rowData(row);
  return { id: r.id, name: r.name, whatsapp: r.whatsapp, service: r.service, location: r.location,
    areas: r.areas.split(',').map(s => s.trim()).filter(Boolean), description: r.description,
    experienceSince: r.experienceSince, photo: r.photo, active: true };
}
async function createApplication(request, env) {
  if (!sameOrigin(request)) return noCache('Origem não autorizada.', 403);
  if (Number(request.headers.get('content-length')) > MAX_PHOTO_BYTES + 14000) return noCache('Arquivo muito grande.', 413);
  const fields = await request.formData();
  if (fields.get('website')) return reply({ ok: true, message: 'Solicitação registrada.' }); // honeypot
  if (fields.get('consent') !== 'yes') return noCache('É necessário autorizar o uso dos dados para o cadastro.');
  const data = checkForm(Object.fromEntries(fields));
  if (!env.DB) return noCache('Cadastro temporariamente indisponível. Tente mais tarde.', 503);
  // Evita cópias acidentais do mesmo pedido enviadas em sequência.
  const duplicate = await env.DB.prepare("SELECT id FROM professionals WHERE whatsapp = ? AND service = ? AND created_at > datetime('now','-3 minutes') LIMIT 1")
    .bind(data.whatsapp, data.service).first();
  if (duplicate) return reply({ ok: true, message: 'Sua solicitação já foi recebida. Aguarde a análise.' });
  const id = crypto.randomUUID();
  let photoKey = null;
  try {
    photoKey = await uploadPhoto(fields.get('photo'), env, id);
    await env.DB.prepare(`INSERT INTO professionals
      (id,name,whatsapp,service,location,areas,description,experience_since,photo_key,consent_at,status,payment_status,active)
      VALUES (?,?,?,?,?,?,?,?,?,datetime('now'),'pending','pending',1)`)
      .bind(id, data.name, data.whatsapp, data.service, data.location, data.areasText,
        data.description, data.experience_since, photoKey).run();
  } catch (error) {
    if (photoKey && env.BUCKET) await env.BUCKET.delete(photoKey).catch(() => {});
    throw error;
  }
  return reply({ ok: true, id, message: 'Cadastro recebido! Aguarde a aprovação da agência. Nenhuma cobrança foi realizada.' }, 201);
}
async function listPublic(env) {
  if (!env.DB) return noCache('Catálogo temporariamente indisponível.', 503);
  const result = await env.DB.prepare(`SELECT * FROM professionals
    WHERE status = 'approved' AND active = 1 AND payment_status = 'confirmed'
    AND paid_until >= date('now') ORDER BY reviewed_at DESC LIMIT 1000`).all();
  return reply({ ok: true, professionals: (result.results || []).map(rowPublic) }, 200, { 'cache-control': 'public, max-age=30' });
}
function paymentEnd(current) {
  const now = new Date();
  const base = current && new Date(`${current}T12:00:00Z`) > now ? new Date(`${current}T12:00:00Z`) : now;
  base.setUTCDate(base.getUTCDate() + 30);
  return base.toISOString().slice(0, 10);
}
async function adminAction(request, env, id) {
  if (!sameOrigin(request)) return noCache('Origem não autorizada.', 403);
  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  const row = await env.DB.prepare('SELECT * FROM professionals WHERE id = ?').bind(id).first();
  if (!row) return noCache('Cadastro não localizado.', 404);
  let query, values;
  switch (action) {
    case 'confirm-payment':
      if (row.status === 'archived') return noCache('O cadastro está arquivado.');
      query = "UPDATE professionals SET payment_status='confirmed', paid_until=?, updated_at=datetime('now') WHERE id=?";
      values = [paymentEnd(row.paid_until), id]; break;
    case 'approve':
      if (row.payment_status !== 'confirmed' || !row.paid_until || row.paid_until < new Date().toISOString().slice(0, 10))
        return noCache('Confirme primeiro a mensalidade para liberar a publicação.');
      if (row.status === 'archived') return noCache('O cadastro está arquivado.');
      query = "UPDATE professionals SET status='approved',active=1,reviewed_at=datetime('now'),updated_at=datetime('now'),reviewed_by=? WHERE id=?";
      values = [request.headers.get('oai-authenticated-user-email'), id]; break;
    case 'suspend':
      query = "UPDATE professionals SET status='suspended',updated_at=datetime('now') WHERE id=? AND status='approved'";
      values = [id]; break;
    case 'reactivate':
      if (row.status !== 'suspended') return noCache('Apenas cadastros suspensos podem ser reativados.');
      if (row.payment_status !== 'confirmed' || !row.paid_until || row.paid_until < new Date().toISOString().slice(0, 10))
        return noCache('Confirme a mensalidade para reativar.');
      query = "UPDATE professionals SET status='approved',updated_at=datetime('now') WHERE id=?";
      values = [id]; break;
    case 'reject':
      query = "UPDATE professionals SET status='rejected',updated_at=datetime('now'),reviewed_at=datetime('now') WHERE id=? AND status != 'archived'";
      values = [id]; break;
    case 'archive':
      query = "UPDATE professionals SET status='archived',active=0,updated_at=datetime('now') WHERE id=?";
      values = [id]; break;
    default: return noCache('Ação desconhecida.');
  }
  await env.DB.prepare(query).bind(...values).run();
  return reply({ ok: true, message: 'Cadastro atualizado.', action });
}
async function adminEdit(request, env, id) {
  if (!sameOrigin(request)) return noCache('Origem não autorizada.', 403);
  const body = await request.json().catch(() => ({}));
  const data = checkForm(body);
  const exists = await env.DB.prepare('SELECT id FROM professionals WHERE id = ? AND status != ?').bind(id, 'archived').first();
  if (!exists) return noCache('Cadastro indisponível.', 404);
  await env.DB.prepare(`UPDATE professionals SET name=?,whatsapp=?,service=?,location=?,areas=?,description=?,experience_since=?,updated_at=datetime('now') WHERE id=?`)
    .bind(data.name, data.whatsapp, data.service, data.location, data.areasText, data.description, data.experience_since, id).run();
  return reply({ ok: true, message: 'Dados atualizados.' });
}
async function adminPhoto(request, env, id) {
  if (!sameOrigin(request)) return noCache('Origem não autorizada.', 403);
  const row = await env.DB.prepare('SELECT photo_key FROM professionals WHERE id=? AND status != ?').bind(id, 'archived').first();
  if (!row) return noCache('Cadastro indisponível.', 404);
  const fields = await request.formData();
  const newKey = await uploadPhoto(fields.get('photo'), env, crypto.randomUUID());
  if (!newKey) return noCache('Escolha uma fotografia.');
  try { await env.DB.prepare("UPDATE professionals SET photo_key=?,updated_at=datetime('now') WHERE id=?").bind(newKey, id).run(); }
  catch (e) { await env.BUCKET.delete(newKey).catch(() => {}); throw e; }
  if (row.photo_key) await env.BUCKET.delete(row.photo_key).catch(() => {});
  return reply({ ok: true, message: 'Fotografia atualizada.' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method;
    try {
      if (pathname === '/' && method === 'GET') return html(PAGE_HTML);
      if (pathname === '/assets/francisca.webp' && method === 'GET') {
        const binary = Uint8Array.from(atob(FRANCISCA_IMAGE_BASE64), c => c.charCodeAt(0));
        return new Response(binary, { headers: { 'content-type': 'image/webp', 'cache-control': 'public, max-age=86400' } });
      }
      if (pathname === '/api/status' && method === 'GET') return reply({ ok: true, database: Boolean(env.DB), photos: Boolean(env.BUCKET), selfRegistration: true });
      if (pathname === '/api/catalogo' && method === 'GET') return reply({ ok: true, services: SERVICE_LABELS, areas: ALLOWED_AREAS });
      if (pathname === '/api/profissionais' && method === 'GET') return await listPublic(env);
      if (pathname === '/api/cadastros' && method === 'POST') return await createApplication(request, env);
      const publicPhoto = pathname.match(/^\/api\/foto\/([0-9a-f-]{36})$/);
      if (publicPhoto && method === 'GET') {
        if (!env.DB) return noCache('Foto indisponível.', 503);
        const row = await env.DB.prepare(`SELECT photo_key FROM professionals WHERE id=? AND status='approved' AND active=1 AND payment_status='confirmed' AND paid_until >= date('now')`).bind(publicPhoto[1]).first();
        return await getImage(env, row?.photo_key);
      }
      if (pathname === '/admin' && method === 'GET') return html(ADMIN_HTML, true);
      if (pathname.startsWith('/api/admin/')) {
        if (!isAdmin(request, env)) return noCache('Acesso restrito à administração do BORAFAZ. Entre com sua conta autorizada.', 403);
        if (!env.DB) return noCache('Banco de dados não habilitado.', 503);
        if (pathname === '/api/admin/me' && method === 'GET') return reply({ ok: true, email: request.headers.get('oai-authenticated-user-email') });
        if (pathname === '/api/admin/cadastros' && method === 'GET') {
          const result = await env.DB.prepare('SELECT * FROM professionals ORDER BY created_at DESC LIMIT 1000').all();
          return reply({ ok: true, professionals: (result.results || []).map(rowData) });
        }
        const pathAction = pathname.match(/^\/api\/admin\/cadastros\/([0-9a-f-]{36})\/(acao|foto)$/);
        if (pathAction && method === 'POST') return pathAction[2] === 'foto'
          ? await adminPhoto(request, env, pathAction[1]) : await adminAction(request, env, pathAction[1]);
        const pathEdit = pathname.match(/^\/api\/admin\/cadastros\/([0-9a-f-]{36})$/);
        if (pathEdit && method === 'PATCH') return await adminEdit(request, env, pathEdit[1]);
        const adminImage = pathname.match(/^\/api\/admin\/foto\/([0-9a-f-]{36})$/);
        if (adminImage && method === 'GET') {
          const row = await env.DB.prepare('SELECT photo_key FROM professionals WHERE id = ?').bind(adminImage[1]).first();
          return await getImage(env, row?.photo_key);
        }
      }
      return noCache('Página ou serviço não encontrado.', 404);
    } catch (error) {
      if (error instanceof Error && /^(Dados inválidos|Preencha|WhatsApp inválido|Profissão não|Localidade não|Informe um ano|É necessário|Envio de fotos|A foto deve|Escolha uma foto|O arquivo selecionado)/.test(error.message)) {
        return noCache(error.message);
      }
      console.error('BORAFAZ API error', error?.message || 'unknown');
      return noCache('Não foi possível concluir a operação. Tente novamente.', 500);
    }
  },
};
