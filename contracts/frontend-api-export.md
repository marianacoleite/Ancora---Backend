# Export API para Frontend (Ancora Backend)

Este documento centraliza tudo o que o frontend precisa para conectar corretamente ao backend.

## 1) Base URL e documentação viva

- **Base URL local (default):** `http://localhost:3000`
- **OpenAPI JSON:** `GET /docs/openapi.json`
- **Swagger UI:** `GET /docs`

## 2) Autenticação

O backend usa token JWT no header:

- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Fluxo recomendado:

1. Chamar `POST /api/v1/auth/login` (ou `register`) para receber `token`.
2. Salvar token no frontend (ex.: memória + persistência local segura).
3. Enviar token em todas as rotas protegidas.
4. Ao iniciar app, validar sessão com `GET /api/v1/auth/me`.

## 3) Healthchecks

- `GET /` -> `{ ok: true, service: "ancora-backend" }`
- `GET /health` -> `{ status: "ok" }`
- `GET /health/supabase` -> status do cliente Supabase
- `GET /health/db` -> teste real de leitura no banco

## 4) Endpoints de Auth

### `POST /api/v1/auth/login`
Body:

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

Response `200`:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### `POST /api/v1/auth/register`
Mesmo body do login. Cria usuário e já retorna token.

### `GET /api/v1/auth/me` (protegido)
Retorna usuário autenticado.

### `POST /api/v1/auth/logout` (protegido)
Retorna `204` (logout lógico no backend).

## 5) Snapshot inicial para hidratar frontend

### `GET /api/v1/app-data` (protegido)
Retorna estrutura completa:

```json
{
  "workspaces": [],
  "subspaces": [],
  "sections": [],
  "tasks": []
}
```

Este endpoint deve ser usado para carga inicial do estado.

## 6) Endpoints CRUD por entidade

## Workspaces
- `POST /api/v1/workspaces`
- `PATCH /api/v1/workspaces/:id`
- `DELETE /api/v1/workspaces/:id`

Create body:

```json
{
  "name": "Workspace A",
  "order": 0
}
```

Patch body:

```json
{
  "name": "Workspace Renomeado"
}
```

## Subspaces
- `POST /api/v1/subspaces`
- `PATCH /api/v1/subspaces/:id`
- `DELETE /api/v1/subspaces/:id`

Create body:

```json
{
  "workspaceId": "workspace_uuid",
  "name": "Subspace A",
  "order": 0
}
```

Patch body:

```json
{
  "name": "Subspace Renomeado"
}
```

## Sections
- `POST /api/v1/sections`
- `PATCH /api/v1/sections/:id`
- `DELETE /api/v1/sections/:id`

Create body:

```json
{
  "workspaceId": "workspace_uuid",
  "subspaceId": "subspace_uuid",
  "name": "Seção A",
  "order": 0
}
```

Patch body:

```json
{
  "name": "Seção Renomeada"
}
```

## Tasks
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/:id`
- `DELETE /api/v1/tasks/:id`

Create body:

```json
{
  "workspaceId": "workspace_uuid",
  "subspaceId": "subspace_uuid",
  "sectionId": "section_uuid",
  "title": "Nova tarefa",
  "status": "pending",
  "tags": ["frontend", "api"],
  "assigneeName": "Maria",
  "dueDate": "2026-04-30T18:00:00.000Z",
  "order": 0
}
```

Patch body (qualquer subconjunto):

```json
{
  "status": "in_progress",
  "order": 1,
  "tags": ["prioridade"]
}
```

Status aceitos para task:
- `pending`
- `in_progress`
- `done`

## 7) Modelo de resposta (objetos)

### Workspace

```json
{
  "id": "uuid",
  "name": "Workspace A",
  "userId": "auth_user_uuid",
  "order": 0,
  "createdAt": 1713200000000
}
```

### Subspace

```json
{
  "id": "uuid",
  "workspaceId": "workspace_uuid",
  "name": "Subspace A",
  "userId": "auth_user_uuid",
  "order": 0,
  "createdAt": 1713200000000
}
```

### Section

```json
{
  "id": "uuid",
  "workspaceId": "workspace_uuid",
  "subspaceId": "subspace_uuid",
  "name": "Seção A",
  "userId": "auth_user_uuid",
  "order": 0,
  "createdAt": 1713200000000
}
```

### Task

```json
{
  "id": "uuid",
  "workspaceId": "workspace_uuid",
  "subspaceId": "subspace_uuid",
  "sectionId": "section_uuid",
  "title": "Nova tarefa",
  "status": "pending",
  "tags": ["frontend", "api"],
  "assigneeName": "Maria",
  "dueDate": "2026-04-30T18:00:00.000Z",
  "order": 0,
  "userId": "auth_user_uuid",
  "createdAt": 1713200000000
}
```

## 8) Erros e tratamento no frontend

Formato padrão de erro:

```json
{
  "message": "descricao do erro"
}
```

Códigos comuns:

- `400`: validação/payload inválido
- `401`: token ausente/inválido ou credenciais inválidas
- `404`: recurso não encontrado
- `500`: erro interno ao consultar banco

## 9) CORS e ambiente

Para conexão correta do frontend, configure no backend (`.env`):

- `CORS_ORIGIN`
- `FRONTEND_URL`
- `FRONTEND_LOCAL_URL`

Exemplo:

```env
CORS_ORIGIN=https://ancora-frontend.vercel.app,http://localhost:5173
FRONTEND_URL=https://ancora-frontend.vercel.app
FRONTEND_LOCAL_URL=http://localhost:5173
```

## 10) Checklist rápido de conexão frontend

- Backend rodando na URL esperada.
- Frontend envia `Authorization: Bearer <token>`.
- Login funciona e token é persistido.
- `GET /api/v1/auth/me` retorna `200`.
- `GET /api/v1/app-data` hidrata o estado inicial.
- CRUD básico de `workspaces`/`tasks` responde sem erro.
