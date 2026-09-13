# Backend de autenticação

A modelagem de `feature/models-entidades` foi integrada ao `develop` pelo PR #8. Esta branch foi atualizada com essa base e acrescenta a configuração do PostgreSQL, as migrations executáveis e a autenticação que o frontend já espera.

## Iniciar com Docker

Na raiz desta cópia de trabalho, com o Docker Desktop aberto:

```powershell
Copy-Item server/.env.example server/.env
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Cole a chave gerada em `JWT_SECRET` no arquivo `server/.env`. Faça a cópia apenas na primeira configuração, para preservar sua chave nas próximas execuções. O `.env` não deve ser commitado.

```powershell
docker compose -p mindspace-backend up -d --build db backend
```

O PostgreSQL fica em `localhost:5432`, a API em `http://localhost:8000` e a documentação interativa em `http://localhost:8000/docs`. O Compose espera o banco ficar disponível e aplica `alembic upgrade head` antes de iniciar a API. Os dados ficam no volume `mindspace-backend_pgdata`; `docker compose -p mindspace-backend stop` interrompe os serviços preservando os dados.

O Compose é um ambiente de desenvolvimento local. As credenciais `postgres/postgres` são locais e as portas do banco e da API são publicadas apenas em `127.0.0.1`.

## Executar a API com Python local

Requer Python 3.12 ou superior. Inicie somente o banco com o Compose e, dentro de `server`, execute:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Configure o `.env` antes conforme a seção anterior. Para Python local, `DATABASE_URL` usa `localhost`; no container, o Compose substitui o endereço por `db`. Não execute a API local e a API do container simultaneamente na porta 8000.

## Conectar o frontend existente

A branch da modelagem ainda não contém as telas de autenticação. Execute o frontend na cópia de trabalho que contém `feature/autenticacao` ou uma branch descendente. No `web/.env` dessa cópia:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```

Reinicie `npm run dev` após mudar essas variáveis. Use `http://localhost:5173`. As origens permitidas são configuradas em `CORS_ORIGINS`, como uma lista JSON.

Contas criadas no modo `mock` ficam no navegador e não são transferidas para o PostgreSQL. Cadastre uma conta no modo `api` para testar o fluxo real. Esta entrega implementa autenticação; grupos, tarefas e preferências ainda precisam dos respectivos endpoints.

## Contrato HTTP

| Método | Caminho | Entrada | Resposta |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `{ "name": "Ana Silva", "email": "ana@example.com", "password": "senha-segura-123" }` | 201 com sessão |
| POST | `/api/v1/auth/login` | `{ "email": "ana@example.com", "password": "senha-segura-123" }` | 200 com sessão |
| GET | `/api/v1/auth/me` | Header `Authorization: Bearer <token>` | 200 com usuário |
| POST | `/api/v1/auth/logout` | Header `Authorization: Bearer <token>` | 204 sem corpo |

Uma sessão tem o formato:

```json
{
  "access_token": "<token>",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": { "id": "1", "name": "Ana Silva", "email": "ana@example.com" }
}
```

O `/me` retorna somente o objeto `user`. O ID é uma string para manter o contrato do frontend. O cadastro normaliza o e-mail para minúsculas, remove espaços nas extremidades e o utiliza também como `login`. Por isso, a segunda migration amplia `usuarios.login` de 50 para 100 caracteres, igual ao limite do e-mail. Nome aceita de 2 a 100 caracteres e senha de 6 a 128, mantendo o mínimo já usado no frontend. Senhas preservam espaços e são armazenadas somente como hash Argon2id.

O token JWT expira em 60 minutos por padrão, configurável por `ACCESS_TOKEN_EXPIRE_MINUTES`. Cada token tem uma sessão persistida no banco; logout revoga apenas a sessão apresentada e os demais dispositivos continuam conectados. Usuários inativos e sessões revogadas ou expiradas não podem acessar `/me`. Não há renovação automática de tokens nesta etapa.

Credenciais incorretas retornam 401; cadastro duplicado, 409; dados inválidos, 422. Erros usam `erro` e `mensagem`, e validações também incluem `campos`, sem repetir senhas enviadas.

## Migrations e testes

A migration original `9ad6d7063717` estava vazia e foi preservada. `b10a20260912` cria as 13 tabelas da modelagem e `b20a20260912` acrescenta as sessões e amplia o login. Todas as entidades são importadas pelo Alembic para comparar o esquema completo.

Os testes usam PostgreSQL e transações isoladas. Crie uma base exclusiva uma vez, na raiz do projeto:

```powershell
docker compose -p mindspace-backend exec -T db createdb -U postgres estudos_colaborativos_test
```

Dentro de `server`:

```powershell
$env:TEST_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/estudos_colaborativos_test'
.\venv\Scripts\python.exe -m pytest -q
.\venv\Scripts\python.exe -m alembic check
```

A suíte exige `TEST_DATABASE_URL` explícita, com nome terminado em `_test`, e aplica as migrations nessa base. Ela cobre cadastro, hash, login, validação, duplicidade, rollback de conflito, contrato do frontend, CORS, expiração, revogação e bloqueio de usuário inativo. `alembic check`, executado separadamente, confere o banco indicado no `.env`.

O downgrade da autenticação reduz novamente o limite de login a 50 caracteres. Se houver valores maiores, o PostgreSQL recusa a redução; não trunque os dados para forçar esse retorno.

## Integração com develop

A dependência da modelagem foi resolvida pelo [PR #8](https://github.com/juliaprianti06/Plataforma-Estudos/pull/8). O backend de autenticação pode ser revisado diretamente contra `develop`. O [PR #9](https://github.com/juliaprianti06/Plataforma-Estudos/pull/9) entrega o frontend de login separadamente. Para validar o fluxo completo antes dos merges, execute esse frontend em uma cópia de trabalho separada, com `VITE_AUTH_MODE=api`, conforme descrito acima.
