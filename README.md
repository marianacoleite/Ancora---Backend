# Ancora Backend

Backend em Node.js + TypeScript para o projeto Ancora, com autenticação e persistência em Supabase (Postgres).

## Visão geral

Este serviço expõe:

- API REST em `/api/v1` para autenticação e CRUD de `workspaces`, `subspaces`, `sections` e `tasks`.
- Endpoints de saúde (`/health`, `/health/supabase`, `/health/db`).
- Documentação OpenAPI via Swagger UI em `/docs`.
- Contratos exportados em `contracts/` para frontend e testes.

## Stack

- Node.js `>=20`
- TypeScript
- Express
- Supabase (`@supabase/supabase-js`)
- Vitest
- Swagger UI (`swagger-ui-express`)

## Pré-requisitos

- Node.js 20+
- NPM
- Projeto Supabase configurado (URL + chaves)
- Banco com as tabelas/migrações esperadas em `supabase/migrations`

## Configuração do ambiente

1. Instale dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows (PowerShell):

```powershell
Copy-Item .env.example .env
```

3. Preencha as variáveis no `.env`.

### Variáveis principais

Obrigatórias para o backend:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (necessária para scripts que usam conexão Postgres direta/DDL)

Opcionais:

- `PORT` (default: `3000`)
- `CORS_ORIGIN` (origens separadas por vírgula)
- `FRONTEND_URL`
- `FRONTEND_LOCAL_URL`
- `SUPABASE_ANON_KEY` (recomendado para login/register)
- `SUPABASE_DIRECT_DATABASE_URL` (fallback para DDL via porta 5432)
- `ANCORA_SEED_USER_ID` (script `seed`)
- `ANCORA_SEED_USER_EMAIL` (script `seed:hierarchy`, default `admancora@ancora.com`)

## Como rodar

### Build

```bash
npm run build
```

### Produção/local compilado

```bash
npm start
```

Servidor sobe em `http://localhost:3000` (ou porta definida em `PORT`).

## Scripts disponíveis

- `npm run build`: compila TypeScript para `dist/`
- `npm start`: executa `dist/server.js`
- `npm run typecheck`: valida tipos sem gerar build
- `npm test`: executa suíte de testes (`vitest run`)
- `npm run test:watch`: testes em modo watch
- `npm run test:supabase`: teste focado de conexão Supabase
- `npm run test:record`: roda testes e grava resultado em `ancora_backend_test_runs`
- `npm run seed`: insere workspace de exemplo para um `user_id`
- `npm run seed:hierarchy`: insere workspace/subspace/section/task para um usuário por e-mail

## Endpoints principais

Base local: `http://localhost:3000`

### Infra

- `GET /` -> status básico do serviço
- `GET /health` -> health check simples
- `GET /health/supabase` -> valida cliente Supabase
- `GET /health/db` -> valida leitura no banco

### Documentação da API

- `GET /docs` -> Swagger UI
- `GET /docs/openapi.json` -> spec OpenAPI em JSON

### Auth (`/api/v1/auth`)

- `POST /login`
- `POST /register`
- `GET /me` (Bearer token)
- `POST /logout` (Bearer token)

### Dados (`/api/v1`)

- `GET /app-data`
- `POST/PATCH/DELETE /workspaces`
- `POST/PATCH/DELETE /subspaces`
- `POST/PATCH/DELETE /sections`
- `POST/PATCH/DELETE /tasks`

> As rotas protegidas exigem `Authorization: Bearer <token>`.

## Contratos e documentação

Arquivos em `contracts/`:

- `openapi.yaml`: contrato principal da API
- `frontend-api-contract.json`: contrato consumido pelo frontend
- `frontend-api-export.md`: documentação textual das rotas e payloads
- `frontend-api-export.txt`: versão em texto simples
- `ancora-backend.postman_collection.json`: coleção para Postman

## Seeds e utilitários

### Seed simples

Executa inserção de um workspace para o usuário informado por `ANCORA_SEED_USER_ID`:

```bash
npm run seed
```

### Seed de hierarquia completa

Cria workspace/subspace/section/task para usuário encontrado por e-mail:

```bash
npm run seed:hierarchy
```

Usa `DATABASE_URL` e `ANCORA_SEED_USER_EMAIL` (opcional).

## Estrutura de pastas (resumo)

- `src/server.ts`: servidor Express e rotas
- `src/config/`: clientes e configuração (Supabase)
- `src/types/`: modelos e mapeamentos
- `src/scripts/`: scripts de seed e automação
- `src/test/`: testes
- `contracts/`: OpenAPI, exportações e Postman
- `supabase/migrations/`: migrações SQL

## Observações importantes

- `SUPABASE_SERVICE_ROLE_KEY` é segredo de backend; nunca expor no frontend.
- O backend opera com escopo de usuário autenticado nas rotas protegidas.
- Para operações DDL locais, prefira conexão direta Postgres (porta 5432) em vez de pooler.

