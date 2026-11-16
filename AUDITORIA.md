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

Execute o teste novamente com:

```bash
node scripts/audit.mjs
```

## Correções desta revisão

1. Botão de anúncio no celular: a seta voltou a aparecer; o link recebeu nome acessível.
2. Contador do catálogo: agora separa quantidade de categorias da quantidade de profissionais efetivamente cadastrados.
3. Metadados de compartilhamento: título e descrição para previews sociais.
4. WhatsApp da agência configurado para **(85) 99712-0397**. O profissional agora preenche os dados e recebe uma conversa pré-preenchida com a administração.
5. Instruções de envio, foto de perfil e atualização/exclusão de cadastro esclarecidas no site.

## Pendências antes de abrir ao público

1. **Canal de inscrição:** WhatsApp administrativo configurado; falta confirmar um envio real de teste. O profissional precisa tocar em **Enviar** no WhatsApp, pois o site não transmite mensagens sozinho.
2. **Mensalidade:** R$ 19,90 é um preço sugerido. O site não processa Pix nem cobra mensalidades; aprovação e pagamento ainda são manuais.
3. **Operação:** o cadastro de profissionais é atualmente mantido no código. Não existe banco de dados nem painel administrativo de assinaturas ou publicação automática.
4. **Acesso:** a publicação do Sites permanece privada. É necessário decidir quando abrir ao público, após as etapas operacionais e jurídicas.
5. **Conteúdo:** somente Francisca está cadastrada. Os demais cards anunciam categorias com inscrições disponíveis, não profissionais fictícios.
6. **Teste visual:** os testes automatizados verificam estrutura e dados; uma inspeção manual final em celulares e navegadores reais ainda é recomendável antes da abertura pública.

**Repositórios:** o projeto tem uma origem Git vinculada ao Sites e uma cópia publicável no GitHub (`cincoregioes-star/borafaz`). Os dois ambientes precisam ser atualizados quando houver novas alterações.
