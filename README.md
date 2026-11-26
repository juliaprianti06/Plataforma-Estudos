# Plataforma de Estudos Colaborativos

Plataforma web para ajudar estudantes a organizar suas atividades acadêmicas, acompanhar o progresso nos estudos e colaborar em grupos. O sistema combina uma interface em React, uma API em FastAPI e um banco de dados PostgreSQL.

> **Status:** Concluído. O planejamento do projeto está organizado em quatro sprints.

## Sumário

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Documentação](#documentação)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Arquitetura e padrões](#arquitetura-e-padrões)

## Visão geral

O projeto apoia estudantes na organização de disciplinas, tarefas e materiais. Também oferece recursos para acompanhar o progresso acadêmico e realizar atividades em conjunto com outros estudantes.

## Funcionalidades

### Implementadas

- Cadastro, login e logout com autenticação por token;
- Visualização e atualização do perfil;
- Cadastro e gerenciamento de disciplinas;
- Criação, edição, conclusão e exclusão de tarefas;
- Quadro Kanban com movimentação de tarefas por drag-and-drop;
- Upload, consulta e gerenciamento de materiais de estudo;
- Grupos de estudo, participação por convite e controle de permissões;
- Acompanhamento do progresso por disciplina e períodos semanal ou mensal;
- Registro, edição e exclusão de sessões de estudo;
- Visualização do tempo estudado no progresso, por período e disciplina;
- Calendário acadêmico com tarefas e eventos do estudante e dos grupos dos quais participa;
- Interface responsiva para desktop, tablets e telas menores.

## Documentação

- [Diagrama da arquitetura](docs/arquitetura.png)
- [Product Backlog](docs/Product_Backlog_Plataforma_Estudos_Colaborativos.pdf)

## Links do projeto

- [Jira](https://estudos-colaborativos.atlassian.net/jira/software/projects/SCRUM/boards/1?filter=&groupBy=none)
- [Figma](https://www.figma.com/design/gI4AUtMlPlB6n6QBDqOA0G/Untitled?node-id=90-441&t=1XHIkw3FU81ihzXi-0-)

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Router, Axios, Radix UI e Lucide |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy e Alembic |
| Banco de dados | PostgreSQL |
| Autenticação | JWT e hash de senhas com Argon2 |
| Infraestrutura | Docker e Docker Compose |
| Testes | pytest, Vitest, Testing Library e Node.js Test Runner |

## Como executar

### Pré-requisitos

- [Docker Desktop](https://www.docker.com/) com Docker Compose;
- Git.

### Configuração

1. Clone o repositório e acesse a pasta:

   ```bash
   git clone https://github.com/juliaprianti06/Lab-Engenharia-Software.git
   cd Lab-Engenharia-Software
   ```

2. Crie o arquivo de ambiente do backend:

   ```powershell
   Copy-Item server/.env.example server/.env
   ```

3. Gere uma chave para `JWT_SECRET` e coloque o valor em `server/.env`:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

   Não versione arquivos `.env` nem compartilhe o segredo.

4. Inicie os serviços na raiz do projeto:

   ```powershell
   docker compose up
   ```

   O Docker Compose inicia o PostgreSQL, o backend e o frontend. O backend aplica as migrações do banco ao iniciar.

5. Acesse a aplicação:

   - Frontend: <http://localhost:5173>
   - API: <http://localhost:8000>
   - Documentação interativa da API: <http://localhost:8000/docs>

Por padrão, o frontend usa a API. Para garantir a configuração, crie `web/.env` a partir de `web/.env.example`:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```

## Testes

Com os containers em execução, crie a base de testes do backend uma única vez:

```powershell
docker compose exec -T db createdb -U postgres estudos_colaborativos_test
```

Se o banco já existir, não é necessário criá-lo novamente.

### Backend

```powershell
docker compose exec backend pytest -v
```

### Frontend

```powershell
docker compose exec frontend npm run test
docker compose exec frontend npm run test:unit
```

### Lint e build

```powershell
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```

## Arquitetura e padrões

O backend possui uma organização em camadas:

- **Routers:** recebem as requisições HTTP;
- **Schemas:** validam os dados de entrada e saída;
- **Commands:** encapsulam operações específicas de escrita;
- **Services:** coordenam regras de negócio;
- **Repositories:** concentram consultas e gravações;
- **Models:** representam as entidades persistidas no banco.

No frontend, as rotas encaminham para páginas, as páginas utilizam componentes reutilizáveis e a pasta `api` centraliza as chamadas HTTP.

### Repository Pattern

Separa o acesso ao banco das rotas e das regras de negócio, facilitando a manutenção e os testes.

### Command Pattern

Encapsula operações de escrita, como criar, atualizar, excluir e movimentar tarefas no Kanban.

### Injeção de dependência e pool de conexões

O FastAPI usa `Depends` para fornecer recursos, como a sessão do banco, às rotas. O SQLAlchemy mantém um pool de conexões reutilizáveis para acessar o PostgreSQL.

## Resumo das sprints

| Sprint | Foco | Situação |
| --- | --- | --- |
| Sprint 1 | Autenticação, segurança, disciplinas, tarefas e perfil | Funcionalidades principais implementadas |
| Sprint 2 | Kanban, dashboard, progresso, filtros e materiais | Parcialmente implementada |
| Sprint 3 | Grupos, membros, permissões e compartilhamento | Recursos de grupos e tarefas colaborativas implementados |
| Sprint 4 | Calendário, sessões de estudo, notificações, testes e documentação | Parcialmente implementada |

### Sprint 1 — Fundação da plataforma

- **US01:** Cadastro de conta;
- **US02:** Login e logout seguros;
- **US03:** Cadastro e visualização de disciplinas;
- **US04:** Criação e visualização de tarefas;
- **US05:** Edição, exclusão e conclusão de tarefas;
- **US06:** Proteção dos dados e controle de acesso;
- **US07:** Interface responsiva;
- **US08:** Visualização e edição de perfil.

### Sprint 2 — Organização acadêmica e materiais

- **US09:** Organização de tarefas em quadro Kanban;
- **US10:** Movimentação de tarefas no Kanban;
- **US11:** Envio de materiais de estudo;
- **US12:** Visualização e download dos materiais;
- **US13:** Dashboard com resumo das atividades;
- **US14:** Filtros e ordenação de tarefas;
- **US15:** Acompanhamento do progresso por disciplina.

O progresso apresenta indicadores semanais ou mensais e utiliza as sessões registradas para calcular o tempo estudado.

### Sprint 3 — Colaboração entre usuários

- **US16:** Criação de grupos de estudo;
- **US17:** Entrada e saída de grupos;
- **US18:** Gerenciamento de membros;
- **US19:** Controle de permissões;
- **US20:** Compartilhamento de materiais;
- **US21:** Download de materiais compartilhados;
- **US22:** Comentários em materiais.

### Sprint 4 — Recursos complementares

- **US23:** Calendário integrado às tarefas e eventos;
- **US24:** Registro, edição e exclusão de sessões de estudo;
- **US25:** Exibição do tempo estudado no progresso;
- **US26:** Notificações sobre prazos e atividades;
- **US27:** Busca por tarefas, disciplinas, grupos e materiais;
- **US28:** Estatísticas de atividades acadêmicas;
- **US29:** Testes dos principais fluxos;
- **US30:** Documentação do projeto e da API.

---

Desenvolvido como projeto da disciplina de Laboratório de Engenharia de Software.
