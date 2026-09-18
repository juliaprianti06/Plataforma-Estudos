# Backend de estudos colaborativos

A modelagem e a autenticação já estão no `develop`. Este checkout inclui a
persistência do perfil, grupos, catálogo, convites, tarefas, eventos e dashboard,
usando o PostgreSQL e as sessões existentes.

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

O frontend de autenticação está no `develop`. A tela de perfil e sua integração HTTP serão entregues em outro PR. Para executar o login, configure `web/.env`:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```

Reinicie `npm run dev` após mudar essas variáveis. Use `http://localhost:5173`. As origens permitidas são configuradas em `CORS_ORIGINS`, como uma lista JSON.

Contas criadas no modo `mock` ficam no navegador e não são transferidas para o PostgreSQL. Cadastre uma conta no modo `api` para testar o fluxo real. Esta entrega inclui autenticação e perfil; os endpoints de grupos e tarefas ficam para outras features.

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

A modelagem ([PR #8](https://github.com/juliaprianti06/Plataforma-Estudos/pull/8)),
a autenticação do backend ([PR #10](https://github.com/juliaprianti06/Plataforma-Estudos/pull/10))
e o login do frontend ([PR #9](https://github.com/juliaprianti06/Plataforma-Estudos/pull/9))
já foram integrados. Este backend de perfil pode ser revisado diretamente contra
`develop`, sem incluir as telas ou as features de grupos, tarefas e dashboard.

## Perfil do usuário

Os endpoints de perfil exigem o mesmo Bearer token da autenticação:

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | `/api/v1/profile/me` | Perfil salvo ou valores iniciais, sem criar registros na leitura |
| PUT | `/api/v1/profile/me` | Atualiza nome, apresentação, foto, interesses e preferências |
| DELETE | `/api/v1/profile/me` | Restaura a personalização e retorna os valores iniciais |
| GET | `/api/v1/profile/me/export` | JSON para download, acrescentando o e-mail da conta |

Exemplo de corpo completo para o PUT:

```json
{
  "name": "Ana Silva",
  "bio": "Estudando Python",
  "interests": ["Programação", "Design"],
  "avatar": null,
  "notifications": { "tasks": true, "groups": false }
}
```

A resposta acrescenta `updatedAt` (data em UTC ou `null` para o perfil inicial).
São permitidos nomes de 2 a 100 caracteres, apresentações de até 300 e até três
interesses da lista da tela. Preferências exigem booleanos. Campos extras, incluindo
ID do usuário, e-mail e atributos de acesso, são rejeitados; a conta é sempre obtida
da sessão autenticada.

A foto usa a data URL já preparada pelo frontend (320 × 320). A API aceita JPEG,
PNG ou WebP estáticos, com até 300.000 caracteres na data URL e 1.024 pixels em cada
dimensão. Pillow verifica o conteúdo, o formato declarado e a decodificação completa.
URLs externas, SVG, conteúdo inválido e imagens animadas são rejeitados. Nesta etapa,
a imagem pequena fica no PostgreSQL junto ao perfil, sem necessidade de um serviço
de arquivos externo.

A migration `c10a20260912` cria `perfis_usuarios`, com uma linha por usuário. A primeira
gravação preserva o nome inicial; atualizações de nome também alteram `usuarios.nome`,
portanto `/auth/me` e novos logins retornam o nome atualizado. Gravação e restauração
usam transação e bloqueio da linha do usuário. A restauração remove somente a linha de
personalização e recupera o nome inicial, mantendo conta, sessões e vínculos de grupos.

A futura integração da tela de perfil usará estes endpoints quando
`VITE_AUTH_MODE=api`. Perfis antigos do navegador não são importados automaticamente.
As preferências são persistidas e retornadas pela API; esta entrega não implementa
geração ou envio de notificações. O e-mail é somente leitura; alteração de senha,
verificação de e-mail e exclusão de conta ficam fora deste contrato.

A suíte inclui persistência, isolamento entre contas, exportação sem dados sensíveis,
restauração com preservação de grupos e validação de fotos. Execute os testes conforme
a seção anterior, sempre com a base exclusiva terminada em `_test`.

## Grupos e convites

Todos os caminhos abaixo são relativos a `/api/v1` e exigem Bearer token.

| Método | Caminho | Operação |
| --- | --- | --- |
| GET | `/groups` | Grupos com participação ativa da conta |
| GET | `/groups/discover` | Até 100 grupos sem vínculo com a conta; sem expor convites |
| POST | `/groups` | Cria grupo, administrador e três colunas Kanban (201) |
| PUT | `/groups/{id}` | Edita dados do grupo, somente administrador |
| POST | `/groups/{id}/join` | Entra em um grupo do catálogo |
| POST | `/groups/join` | Entra por `{ "code": "ABC123" }` |

Criação/edição recebem `name`, `description`, `category` e `icon`.
A criação aceita `inviteCode` opcional, de seis letras/números maiúsculos;
se omitido, o servidor gera um código. Colisão de código enviado retorna 409
sem criar grupo. Nomes exigem 3–60 caracteres, descrições 10–240 e categorias/
ícones seguem os valores da tela. O convite não muda ao editar.

Grupos são descobertos por usuários autenticados e permitem entrada direta;
convite é uma alternativa de acesso, não uma barreira de privacidade.
Não há grupos privados, remoção de membros ou aprovação de pedidos nesta etapa.
Entrada usa transação e bloqueio do grupo, rejeita duplicidade e retorna a contagem
real de membros ativos. Somente status `admin` e `ativo` autorizam participação.
A migration `g10a20260913`, posterior ao perfil `c10a20260912`, adiciona categoria,
ícone e convite único, preenchendo os grupos existentes.

## Dependências desta entrega

A implementação de perfil do backend é a mesma do PR #11 e faz parte da base
desta branch. A entrega acrescenta grupos no backend e frontend, além das
telas e da integração de perfil no frontend. Não inclui as migrations alternativas
de disciplinas/tarefas do PR #12.

## Tarefas, eventos e dashboard

A organização repositório + Commands de `feature/tarefas` foi adaptada ao modelo
aprovado: tarefas pertencem a colunas de grupos e se vinculam a responsáveis.
Não foi feito merge nem alteração na branch do autor. IDs e autenticação seguem
as entidades aprovadas e a sessão Bearer do backend atual.

| Método | Caminho relativo a `/api/v1` | Operação |
| --- | --- | --- |
| GET | `/tasks?groupId=1` | Tarefas dos grupos da conta; filtro de grupo opcional |
| POST | `/tasks` | Cria tarefa e registra o criador como responsável (201) |
| PUT | `/tasks/{id}` | Atualiza campos e coluna conforme o status |
| DELETE | `/tasks/{id}` | Exclui tarefa e seus vínculos de responsabilidade (204) |
| GET | `/events` | Próximos 100 eventos dos grupos da conta |
| POST | `/events` | Administrador cria encontro com data futura (201) |
| DELETE | `/events/{id}` | Administrador exclui encontro (204) |
| GET | `/dashboard` | Tarefas, eventos, avisos e progresso real |

Exemplo de tarefa:

```json
{
  "groupId": "1",
  "title": "Revisar exercícios",
  "description": "Capítulo 2",
  "priority": "high",
  "status": "todo",
  "dueAt": "2030-01-15T18:00:00-03:00",
  "disciplineId": null
}
```

No PUT, envie os campos sem `groupId`; esta etapa não permite transferência entre
grupos. `priority` aceita high/medium/low e `status` aceita todo/progress/done;
o serviço traduz para os valores das entidades. `dueAt` é opcional e exige fuso.
`disciplineId`, quando enviado, precisa estar vinculado ao grupo. A seleção de
disciplinas e gestão de responsáveis ainda não fazem parte da interface.
Responsáveis e administradores editam/excluem; outros membros apenas consultam.
Pessoas sem participação ativa recebem 404 para recursos de outros grupos.

Eventos recebem `groupId`, `title` e `startsAt` com fuso e data futura.
O dashboard calcula progresso pelas tarefas concluídas de todos os grupos da
conta, sem dados de demonstração. A tarefa retomável precisa ser editável e pendente;
prioriza tarefas em andamento e prazo mais próximo. Retomar usa PUT, registrando
o primeiro início. Os avisos respeitam preferências de perfil e abrangem tarefas
vencidas/com prazo em até 24 horas e eventos em até sete dias, limitados a 20.
Não há envio externo, leitura persistida de notificações nem atualização em tempo real.

A migration `t10a20260913` depende de `g10a20260913`, cria `eventos_grupo` e completa
colunas Kanban ausentes nos grupos antigos. Seu downgrade remove eventos e
preserva as colunas para não apagar tarefas existentes.

Esta entrega depende de grupos e perfil. Os modelos de tarefas preservam as
entidades aprovadas de grupos, colunas Kanban e responsáveis; a implementação
alternativa do PR #12 precisa ser compatibilizada antes de integrar as duas.
