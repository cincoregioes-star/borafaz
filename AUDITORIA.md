# Auditoria técnica — BORAFAZ.

**Data:** 16/11/2026  
**Escopo:** catálogo, filtros, navegação, dados profissionais, links, conteúdo de cadastro e publicação do site.

## Resultado dos testes automatizados

- **58 categorias de serviço**, sem IDs duplicados e com ícones válidos.
- **13 localidades** disponíveis no filtro e no cadastro profissional.
- **1 perfil real**, com profissão válida, WhatsApp formatado e fotografia presente na versão publicada.
- **JavaScript válido**, sem erros de sintaxe.
- **Links internos e elementos essenciais** encontrados.
- **Código de origem e HTML de publicação idênticos**.
- **Worker de banco de dados e moderação** construído sem dependências externas.
- **Migração SQL** de cadastro, status e pagamentos, com índice por profissão/telefone.
- **Painel restrito** ao proprietário pela identidade autenticada e por segredo de ambiente.
- **Fotos pendentes privadas** até aprovação e pagamento.

Execute o teste novamente com:

```bash
node scripts/audit.mjs
node scripts/build-worker.mjs
node scripts/test-worker.mjs
```

## Correções desta revisão

1. Botão de anúncio no celular: a seta voltou a aparecer; o link recebeu nome acessível.
2. Contador do catálogo: agora separa quantidade de categorias da quantidade de profissionais efetivamente cadastrados.
3. Metadados de compartilhamento: título e descrição para previews sociais.
4. WhatsApp da agência configurado para **(85) 99712-0397**. O profissional agora preenche os dados e recebe uma conversa pré-preenchida com a administração.
5. Instruções de envio, foto de perfil e atualização/exclusão de cadastro esclarecidas no site.
6. Fluxo completo de cadastro: banco D1, foto R2, aprovação manual e confirmação de Pix no painel.
7. Testes integrados com SQLite em memória: cadastro pendente, acesso negado, aprovação bloqueada sem pagamento, ativação, publicação, foto e suspensão.

## Pendências antes de abrir ao público

1. **Canal de inscrição:** o Site dinâmico grava pedidos no banco; a cópia do GitHub Pages usa WhatsApp como contingência.
2. **Mensalidade:** R$ 19,90 é um preço sugerido. O site não processa Pix nem cobra mensalidades; aprovação e pagamento ainda são manuais.
3. **Operação:** novos profissionais serão controlados pelo banco e painel. O perfil legado da Francisca ainda permanece no HTML, fora do controle administrativo.
4. **Acesso:** o Site permanece privado. É necessário decidir quando abrir ao público, após as etapas operacionais e jurídicas.
5. **Conteúdo:** somente Francisca está previamente cadastrada. Os demais cards anunciam categorias disponíveis, não profissionais fictícios.
6. **Teste visual:** testes automáticos não substituem inspeção no celular. A implantação real do banco e as permissões do Sites devem ser confirmadas após o deploy.

**Repositórios:** o projeto tem uma origem Git vinculada ao Sites e uma cópia publicável no GitHub (`cincoregioes-star/borafaz`). Os dois ambientes precisam ser atualizados quando houver novas alterações.
