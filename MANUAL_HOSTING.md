# Master Beams — Hospedagem manual

Este pacote contém a aplicação full-stack Master Beams, baseada em React, TypeScript, Express, tRPC, Drizzle e MySQL/TiDB. Não é um site estático simples: os fluxos de autenticação, canais, cards e uploads dependem do servidor e do banco de dados.

## Requisitos

Use Node.js 22 ou superior, pnpm 10 ou superior e um banco MySQL/TiDB compatível. Configure as variáveis de ambiente já utilizadas pelo template, especialmente `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL` e `VITE_FRONTEND_FORGE_API_KEY`.

## Instalação

```bash
pnpm install
pnpm drizzle-kit generate
pnpm build
pnpm start
```

Antes do primeiro uso, aplique a migração SQL em `drizzle/0001_curly_roughhouse.sql` no banco. O servidor não deve expor as variáveis secretas no frontend.

## Imagem da marca

A imagem enviada está incluída em `manual-assets/master-beams-mark.jpg`. O pacote manual já inclui a imagem em `client/public/master-beams-mark.jpg` e o código já referencia `/master-beams-mark.jpg`.

## Segurança

Use HTTPS, mantenha `JWT_SECRET` privado, habilite cookies seguros no domínio final e configure corretamente CORS e o proxy reverso. O banco deve permanecer privado e acessível apenas pelo servidor.
