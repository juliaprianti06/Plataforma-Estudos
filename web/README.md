# MindSpace — frontend

Plataforma em React, TypeScript e Vite.

## Executar sem banco de dados

```sh
npm install
npm run dev
```

O modo padrão é `mock` e funciona sem servidor. Abra Login ou Criar Conta e
clique em **Entrar na demonstração**, ou use um e-mail fictício e qualquer senha
com pelo menos 6 caracteres.

O cadastro simula uma sessão com o nome informado. **Não cria uma conta real e
não verifica nem salva senhas.** Depois de sair, um novo login simulado usa a
parte anterior ao @ como nome. O usuário de demonstração é
`demo@mindspace.test`.

A sessão dura 24 horas. Sem “Lembrar de mim”, fica no `sessionStorage` da aba;
com a opção, fica no `localStorage`, até expirar ou sair. O cadastro usa uma sessão
temporária. Se o armazenamento estiver bloqueado, a sessão funciona apenas em
memória. Recarregar preserva uma sessão válida; acesso direto a
`/dashboard` sem sessão retorna à página inicial. Isso é controle de navegação
para demonstração, não uma barreira de segurança.

## Conectar ao backend depois

Copie `.env.example` para `.env` e configure:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```

Reinicie o Vite após alterar essas variáveis. Elas são públicas no bundle;
credenciais de banco e segredos pertencem somente ao servidor.

A interface `src/auth/types.ts` separa as telas do provedor de autenticação.
`mock-provider.ts` simula o fluxo; `api-provider.ts` usa a API HTTP.
Não há fallback automático para demonstração quando a API falha.
Sessões mock não são aceitas no modo API.

**O backend de autenticação ainda precisa ser implementado.** Os arquivos
`server/app/routers/auth_router.py`, `services/auth_service.py` e
`schemas/usuario_schema.py` estão vazios, e o router está comentado em
`server/app/main.py`. Configurar a URL não implementa essas rotas.

Contrato esperado, relativo a `VITE_API_URL`:

| Método | Rota | Corpo / resposta |
| --- | --- | --- |
| POST | /auth/register | Recebe `{ name, email, password }`; retorna sessão |
| POST | /auth/login | Recebe `{ email, password }`; retorna sessão |
| GET | /auth/me | Recebe Bearer token; retorna `{ id, name, email }` |
| POST | /auth/logout | Recebe Bearer token; invalida a sessão; retorna 204 |

Login e cadastro devem responder com:

```json
{
  "access_token": "token-emitido-pelo-servidor",
  "expires_in": 3600,
  "user": {
    "id": "identificador-em-string",
    "name": "Ana Silva",
    "email": "ana@example.test"
  }
}
```

`expires_in` é a validade em segundos. O frontend envia
`Authorization: Bearer <access_token>` nas chamadas autenticadas,
consulta `/auth/me` ao restaurar a sessão e encerra o acesso em caso de
expiração ou HTTP 401 de uma chamada autenticada. O logout sempre remove a
sessão local; se a API estiver indisponível, a revogação no servidor dependerá
da expiração do token.

Erros tratados: 401 (credenciais inválidas), 409 (e-mail já cadastrado),
422 (dados inválidos), 429 (excesso de tentativas), timeout e falha de rede.
Recuperação de senha ainda não foi implementada; o botão informa isso.

No servidor, conecte router → serviço de autenticação → repositório de usuários
→ banco de dados. Implemente validação, hash de senha, unicidade de e-mail,
emissão/validação/expiração/revogação de tokens e autorização em todas as rotas
privadas. Configure CORS para a origem do frontend.

O adaptador atual espera tokens Bearer guardados conforme “Lembrar de mim”.
Se o backend adotar cookies HttpOnly, adapte o cliente e o provedor para
credenciais por cookie, com as proteções de CSRF correspondentes.

## Verificação

```sh
npm test
npm run lint
npm run build
```

Os testes usam Node.js 24, o runner nativo e o Vite já instalado. Cobrem
persistência, expiração, armazenamento indisponível, separação mock/API,
contratos HTTP, erros e logout. As chamadas HTTP são simuladas nos testes;
não exigem banco de dados nem backend ativo.
