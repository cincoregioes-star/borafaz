# BORAFAZ. — Serviço bom, gente perto

Vitrine digital para encontrar profissionais de Beberibe e região. Clientes pesquisam gratuitamente e podem conversar diretamente com os prestadores de serviço pelo WhatsApp.

## Recursos

- 58 categorias profissionais, incluindo diaristas, professores particulares, pintores e técnicos de máquinas de lavar.
- Filtros por profissão e localidade; layout responsivo com animações nos cards.
- Perfis com foto, nome, áreas de atendimento e botão de WhatsApp.
- Formulário de solicitação de cadastro para profissionais.
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
```

## Antes do lançamento comercial

- Informar um WhatsApp administrativo no campo `CONFIG.adminWhatsapp` do `index.html`.
- Definir os meios de recebimento das mensalidades. Não existe cobrança automática.
- Cadastrar profissionais reais mediante autorização de divulgação.
- Completar dados de atendimento, privacidade e regras comerciais.
- O formulário atual não cria uma conta nem salva cadastros automaticamente: ele prepara a solicitação para envio à agência.

O projeto também possui uma prévia privada vinculada ao ChatGPT Sites. Este repositório do GitHub é uma cópia publicável, sem necessidade do arquivo privado de hospedagem do Sites.
