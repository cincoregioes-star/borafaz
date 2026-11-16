# BORAFAZ. — Serviço bom, gente perto

Vitrine digital para encontrar profissionais de Beberibe e região. Clientes pesquisam gratuitamente e podem conversar diretamente com os prestadores de serviço pelo WhatsApp.

## Recursos

- 58 categorias profissionais, incluindo diaristas, professores particulares, pintores e técnicos de máquinas de lavar.
- Filtros por profissão e localidade; layout responsivo com animações nos cards.
- Perfis com foto, nome, áreas de atendimento e botão de WhatsApp.
- Formulário preenchido pelo profissional, com foto opcional, envio ao banco de dados e análise antes da divulgação.
- Painel administrativo `/admin`, com aprovação, edição, suspensão, arquivamento e confirmação manual da mensalidade.
- Perfis novos aparecem automaticamente no catálogo apenas após aprovação **e** confirmação de pagamento.
- Informações sobre a mensalidade sugerida de R$ 19,90.

## Como publicar no GitHub Pages

1. Acesse **Settings → Pages** neste repositório.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main**, a pasta **/(root)** e salve.
4. Depois de o GitHub concluir a publicação, o site ficará no endereço `https://cincoregioes-star.github.io/borafaz/`.

> O endereço só estará disponível quando o GitHub Pages tiver sido ativado com sucesso. O repositório público já pode exibir o código e a fotografia profissional incluída nele.

## Arquivos principais

| Arquivo | Finalidade |
| --- | --- |
| `index.html` | Página completa, CSS, scripts, catálogo e perfis. |
| `assets/francisca.webp` | Retrato profissional da Francisca. |
| `scripts/audit.mjs` | Testes estruturais e de integridade do site. |
| `AUDITORIA.md` | Resultado da auditoria e pendências. |

## Verificação

```bash
node scripts/audit.mjs
node scripts/build-worker.mjs
node scripts/test-worker.mjs
```

## Hospedagem com banco de dados

- O GitHub Pages mantém a vitrine estática e o cadastro por WhatsApp como contingência. Ele **não executa** o banco nem o painel.
- O ChatGPT Sites usa um Worker com banco Cloudflare D1 (`DB`), armazenamento de fotografias R2 (`BUCKET`) e migração em `drizzle/0000_borafaz.sql`.
- O catálogo da hospedagem dinâmica consulta `/api/profissionais` e divulga somente registros aprovados, ativos e com mensalidade confirmada/válida.
- O administrador entra em `/admin` usando a conta autorizada pela hospedagem. A identidade administrativa é comparada a `BORAFAZ_ADMIN_EMAIL`, variável secreta configurada no Sites. Não há senha exposta no código.
- Confirmar um Pix no painel é uma **declaração manual** do administrador, não uma consulta bancária. Isso acrescenta 30 dias ao prazo de anúncio.
- O perfil legado da Francisca continua publicado diretamente no HTML original e não está, nesta etapa, sujeito ao painel de pagamentos.
- Enviar formulário não aprova, não cobra e não publica automaticamente o cadastro.

## Antes da abertura comercial

- WhatsApp da agência configurado: **(85) 99712-0397** (`CONFIG.adminWhatsapp`). Verificar o recebimento de uma solicitação de teste.
- Definir a chave Pix e testar o recebimento das mensalidades. Não existe cobrança automática.
- Cadastrar profissionais reais mediante autorização de divulgação.
- Completar dados de atendimento, privacidade e regras comerciais.
- Fazer um cadastro de teste no site dinâmico, aprovar no painel e conferir a publicação no catálogo.
- O Site hospedado permanece privado para o proprietário até a liberação explícita do acesso público.

Este repositório do GitHub preserva a vitrine estática. O painel e a API são componentes específicos da hospedagem dinâmica do ChatGPT Sites.
