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

**Esta branch entrega o frontend de autenticação.** O backend foi
implementado separadamente em `feature/backend-autenticacao` e aguarda a
integração da modelagem. Enquanto essa entrega não entrar em `develop`,
o modo `mock` permite revisar o frontend sem banco. Para testar o modo `api`,
execute o backend da branch correspondente em uma cópia de trabalho separada.

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

A entrega do backend deve manter validação, hash de senha, unicidade de
e-mail, expiração e revogação de tokens e autorização nas rotas privadas.
O CORS deve permitir a origem do frontend. A proteção de navegação no React
não substitui essas verificações no servidor.

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
