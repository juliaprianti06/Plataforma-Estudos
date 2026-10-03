# Backend

API da Plataforma de Estudos Colaborativos, construída com Python, FastAPI e PostgreSQL. O backend fornece autenticação e operações para perfil, disciplinas, tarefas, materiais e progresso.

## Tecnologias

- **FastAPI** e **Uvicorn** para a API HTTP.
- **Pydantic** para validar configurações e dados de entrada e saída.
- **SQLAlchemy** e **psycopg2** para persistência no PostgreSQL.
- **Alembic** para versionar alterações no banco.
- **PyJWT** e **pwdlib/Argon2** para tokens e hash de senhas.
- **Pillow** e **python-multipart** para imagens e envio de arquivos.
- **pytest** e **httpx** para testes.

## Estrutura

```text
app/
├── commands/    # operações de escrita
├── core/        # segurança, permissões e exceções
├── models/      # entidades SQLAlchemy
├── repository/  # consultas e persistência no banco
├── routers/     # endpoints HTTP
├── schemas/     # validação e formato dos dados da API
├── services/    # regras de negócio e coordenação
├── alembic/     # configuração e migrations
├── config.py    # configurações do ambiente
├── database.py  # engine e sessões do SQLAlchemy
└── main.py      # criação da aplicação e registro das rotas
```

As rotas recebem requisições e delegam o trabalho às camadas da aplicação. Schemas representam o contrato HTTP, enquanto models representam os dados persistidos. O FastAPI fornece recursos como a sessão do banco e a autenticação por injeção de dependências.

## Configuração

Na raiz do repositório, crie `server/.env`:

```powershell
Copy-Item server/.env.example server/.env
```

Gere uma chave para `JWT_SECRET` e coloque-a no arquivo:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```


## Iniciar a aplicação

Com o Docker Desktop aberto, execute na raiz do repositório:

```powershell
docker compose up
```

O Compose inicia PostgreSQL, backend e frontend. A API fica em `http://localhost:8000`, a documentação interativa em `http://localhost:8000/docs` e o frontend em `http://localhost:5173`. O backend aplica as migrations ao iniciar.

## Endpoints principais

As rotas ficam sob o prefixo `/api/v1`. Endpoints privados exigem `Authorization: Bearer <token>`.

| Área | Rotas |
| --- | --- |
| Autenticação | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| Perfil | `GET /profile/me`, `PUT /profile/me`, `DELETE /profile/me`, `GET /profile/me/export` |
| Disciplinas | `GET` e `POST /disciplinas/`, `PUT` e `DELETE /disciplinas/{id}` |
| Tarefas | `POST /tarefas/`, `GET /tarefas/disciplina/{id}`, `PUT` e `DELETE /tarefas/{id}` |
| Materiais | `GET` e `POST /materiais/`, `PUT` e `DELETE /materiais/{id}` |
| Progresso | `GET /progresso/?periodo=semana` ou `GET /progresso/?periodo=mes` |

## Migrations

O backend aplica migrations automaticamente ao iniciar com Docker Compose. Para executar um comando manualmente:

```powershell
docker compose exec backend alembic upgrade head
docker compose exec backend alembic current
docker compose exec backend alembic check
```

## Testes

O container de desenvolvimento do backend instala as dependências de teste. A suíte usa uma base PostgreSQL separada, que precisa ser criada uma vez. Com o Compose ativo, execute na raiz:

```powershell
docker compose exec -T db createdb -U postgres estudos_colaborativos_test
```

Se a base já existir, não é necessário criá-la novamente. Para executar todos os testes do backend:

```powershell
docker compose exec backend pytest -v
```

O `TEST_DATABASE_URL` do container aponta para essa base. A suíte aplica as migrations nela e recusa URLs cujo nome não termine em `_test`, para reduzir o risco de executar testes no banco normal.
