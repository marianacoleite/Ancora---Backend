# O que o backend precisa expor (Âncora Frontend)

Este documento descreve **tudo o que o servidor HTTP deve implementar** para o cliente web (`Ancora-Frontend`) funcionar em modo backend: rotas, formatos JSON, autenticação e regras esperadas.

Referências no código: `src/services/api/client.ts`, `routes.ts`, `types.ts`, `authApi.ts`, `appDataApi.ts`, `src/types/models.ts`. Há também `contracts/openapi.yaml` e `contracts/index.ts` para alinhamento técnico.

---

## 1. URL base e prefixo da API REST

- O frontend usa a variável **`VITE_BACKEND_URL`** como **URL base do servidor** (sem barra final), por exemplo `http://localhost:3000`.
- Todas as rotas da API REST descritas abaixo são **relativas ao prefixo fixo**:
  - **`/api/v1`**
- Exemplo completo: se `VITE_BACKEND_URL` for `http://localhost:3000`, o login fica em  
  `http://localhost:3000/api/v1/auth/login`.

**Rotas fora de `/api/v1` (opcionais mas usadas na UI):**

| Método | Caminho (relativo à base) | Uso no frontend |
|--------|---------------------------|-----------------|
| GET | `/` | Raiz; resposta JSON flexível (ex.: `{ ok, service }`). |
| GET | `/health` | Estado do serviço; resposta JSON flexível (ex.: `{ status }`). |

Estas duas chamadas **não** enviam prefixo `/api/v1` nem JWT. Servem para indicar na barra lateral se o servidor está acessível.

---

## 2. CORS

- O browser vai chamar o backend a partir do origin do Vite (ex.: `http://localhost:5173`).
- O servidor deve permitir **CORS** para esse origin (e o origin de produção quando existir), incluindo:
  - Métodos: pelo menos `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`.
  - Cabeçalhos: `Authorization`, `Content-Type`, `Accept`.
- Sem CORS correto, o login e a API falham no browser mesmo com o servidor a correr.

---

## 3. Formato geral das requisições

- Corpo: **JSON** com `Content-Type: application/json` quando houver corpo.
- Respostas com corpo: **JSON** com `Accept: application/json` esperado pelo cliente.
- Respostas sem corpo: o cliente trata **`204 No Content`** como sucesso (corpo vazio).

---

## 4. Autenticação (JWT)

- Em **todas** as rotas sob `/api/v1` **exceto** `POST /auth/login` e `POST /auth/register`, o cliente envia:
  - **`Authorization: Bearer <token_jwt>`**
  - O token vem da resposta de login/registo (`token`) e é guardado no browser (`sessionStorage`).
- Se o token estiver em falta ou for inválido, o backend deve responder com **401** (ou outro 4xx/5xx coerente); o cliente mostra a mensagem de erro ao utilizador.

**Sugestão de implementação:** o JWT deve identificar o utilizador (pelo menos `userId` ou `sub`); todas as listagens e escritas de dados devem estar **limitadas ao utilizador autenticado**. Os objetos devolvidos incluem o campo **`userId`** nas entidades; deve corresponder ao utilizador do token.

---

## 5. Rotas de autenticação (`/api/v1`)

Todas com corpo/resposta em JSON salvo indicação em contrário.

### 5.1 `POST /auth/login`

- **Sem** cabeçalho `Authorization`.
- **Corpo:** `{ "email": string, "password": string }`
- **Resposta 200:**  
  `{ "token": string, "user": { "id": string, "email": string } }`  
  O frontend espera **sempre** `token` e `user` neste formato.

### 5.2 `POST /auth/register`

- Igual ao login em formato de pedido e resposta (corpo `{ email, password }`, resposta `{ token, user }`).

### 5.3 `GET /auth/me`

- **Com** JWT.
- **Resposta 200:** `{ "user": { "id": string, "email": string } }`

### 5.4 `POST /auth/logout`

- **Com** JWT (no cliente atual).
- **Corpo:** o cliente envia `{}` (objeto JSON vazio).
- **Resposta:** pode ser **204** sem corpo ou 200 com JSON; o cliente aceita sucesso sem corpo útil.

---

## 6. Dados da aplicação — snapshot (`GET /api/v1/app-data`)

- **Com** JWT.
- **Resposta 200:** um único objeto JSON com a forma **`AppData`** (ver secção 8):
  - `workspaces`: array
  - `subspaces`: array
  - `sections`: array
  - `tasks`: array  
- Deve devolver **apenas** dados do utilizador autenticado.

---

## 7. CRUD por recurso (sempre sob `/api/v1`, com JWT)

Convenção de IDs: nos URL paths, o `:id` é o identificador string da entidade (ex.: UUID ou o que o backend usar).

### 7.1 Workspaces

| Método | Caminho | Corpo | Resposta de sucesso |
|--------|---------|--------|----------------------|
| POST | `/workspaces` | `{ "name": string, "order": number }` | **200** com objeto **Workspace** completo (ver secção 8) |
| PATCH | `/workspaces/:id` | `{ "name": string }` | **200** com **Workspace** atualizado |
| DELETE | `/workspaces/:id` | — | **204** recomendado (ou 200 sem corpo, se o cliente for ajustado; o cliente atual espera 204 em DELETE) |

**Regra:** ao apagar um workspace, o servidor deve **eliminar em cascata** (ou recusar com erro claro) subespaços, secções e tarefas associados a esse workspace. O frontend assume consistência hierárquica após o DELETE.

### 7.2 Subespaços (subspaces)

| Método | Caminho | Corpo | Resposta de sucesso |
|--------|---------|--------|----------------------|
| POST | `/subspaces` | `{ "workspaceId": string, "name": string, "order": number }` | **200** com **Subspace** |
| PATCH | `/subspaces/:id` | `{ "name": string }` | **200** com **Subspace** |
| DELETE | `/subspaces/:id` | — | **204** |

**Regra:** DELETE deve cascatear secções e tarefas desse subespaço (ou erro coerente).

### 7.3 Secções (sections)

| Método | Caminho | Corpo | Resposta de sucesso |
|--------|---------|--------|----------------------|
| POST | `/sections` | `{ "workspaceId": string, "subspaceId": string, "name": string, "order": number }` | **200** com **Section** |
| PATCH | `/sections/:id` | `{ "name": string }` | **200** com **Section** |
| DELETE | `/sections/:id` | — | **204** |

**Regra:** DELETE deve remover tarefas dessa secção (cascata) ou falhar de forma explícita.

### 7.4 Tarefas (tasks)

| Método | Caminho | Corpo | Resposta de sucesso |
|--------|---------|--------|----------------------|
| POST | `/tasks` | Ver **CreateTaskBody** abaixo | **200** com **Task** |
| PATCH | `/tasks/:id` | Objeto parcial (ver **PatchTaskBody**) | **200** com **Task** |
| DELETE | `/tasks/:id` | — | **204** |

**CreateTaskBody (POST /tasks):**

```json
{
  "workspaceId": "string",
  "subspaceId": "string",
  "sectionId": "string",
  "title": "string",
  "status": "pending | in_progress | done",
  "tags": ["string", "..."],
  "assigneeName": "string | null",
  "dueDate": "string | null",
  "order": 0
}
```

**PatchTaskBody (PATCH /tasks/:id):** qualquer subconjunto dos campos:

- `title`, `status`, `tags`, `assigneeName`, `dueDate`, `order`
- `sectionId`, `subspaceId`, `workspaceId` (para mover tarefa na hierarquia, se o backend suportar)

`status` só pode ser um dos valores: **`pending`**, **`in_progress`**, **`done`**.

---

## 8. Modelos de dados (campos que o JSON deve ter)

Tipos de referência: `src/types/models.ts`.

### 8.1 `TaskStatus` (string)

- `"pending"`
- `"in_progress"`
- `"done"`

### 8.2 `Workspace`

- `id`: string  
- `name`: string  
- `userId`: string  
- `order`: number  
- `createdAt`: number (timestamp; o frontend usa número, tipicamente milissegundos Unix)

### 8.3 `Subspace`

- `id`, `workspaceId`, `userId`, `name`, `order`, `createdAt` (mesma ideia de tipos que Workspace)

### 8.4 `Section`

- `id`, `subspaceId`, `workspaceId`, `userId`, `name`, `order`, `createdAt`

### 8.5 `Task`

- `id`, `sectionId`, `subspaceId`, `workspaceId`, `userId`
- `title`: string  
- `status`: `TaskStatus`  
- `tags`: array de strings  
- `assigneeName`: string ou `null`  
- `dueDate`: string ou `null` (formato livre para o backend; o cliente envia/recebe como string ou null)  
- `order`: number  
- `createdAt`: number  

### 8.6 `AppData` (resposta de `GET /app-data`)

```json
{
  "workspaces": [ /* Workspace[] */ ],
  "subspaces": [ /* Subspace[] */ ],
  "sections": [ /* Section[] */ ],
  "tasks": [ /* Task[] */ ]
}
```

---

## 9. Erros HTTP e corpo de erro

- Para respostas **não OK** (4xx/5xx), o cliente tenta ler JSON e usar **`message`** ou **`error`** como texto apresentado ao utilizador.
- Exemplo útil: `{ "message": "Credenciais inválidas" }` ou `{ "error": "..." }`.

---

## 10. Checklist rápido para o implementador do backend

- [ ] Servidor com URL base configurável; frontend usa só essa base + `/api/v1/...`.
- [ ] CORS configurado para o origin do frontend.
- [ ] `POST /api/v1/auth/login` e `.../register` sem JWT; resposta com `token` + `user { id, email }`.
- [ ] Demais rotas `/api/v1/*` (exceto login/register) com validação JWT `Bearer`.
- [ ] `GET /api/v1/app-data` devolve os quatro arrays do utilizador.
- [ ] POST/PATCH devolvem entidade completa com os campos do modelo; DELETE devolve **204** onde indicado.
- [ ] DELETE em workspace / subespaço / secção com política clara (cascata recomendada).
- [ ] Campos `userId` nas entidades alinhados com o utilizador do token.
- [ ] (Opcional) `GET /` e `GET /health` na raiz da base para diagnóstico na UI.

---

*Documento gerado para alinhar o backend com o cliente Âncora Frontend. Em caso de divergência, o comportamento real do código em `src/services/api/` prevalece.*
