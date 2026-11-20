# Frontend

Interface web da Plataforma de Estudos Colaborativos, desenvolvida com React, TypeScript e Vite. O frontend consome a API do backend e oferece autenticação em modo de demonstração (`mock`).

## Tecnologias

- **React** e **TypeScript** para construir a interface por componentes.
- **Vite** para desenvolvimento e build de produção.
- **TanStack Router** para as rotas da aplicação.
- **Axios** para chamadas HTTP à API.
- **Tailwind CSS** para estilos responsivos.
- **Radix UI**, componentes baseados em shadcn/ui e **Lucide** para ícones.
- **Vitest**, **Testing Library** e o runner de testes nativo do Node.js para verificação.

## Estrutura

```text
src/
├── api/         # cliente HTTP e funções de acesso à API
├── auth/        # provedores e estado da autenticação
├── components/  # layout e componentes compartilhados
├── data/        # dados usados pelas telas
├── lib/         # funções utilitárias
├── pages/       # telas organizadas por funcionalidade
├── routes/      # rotas e proteção de navegação
└── styles/      # estilos globais
```

As páginas montam as telas usando componentes. A pasta `api` isola as chamadas ao backend. A proteção de navegação no frontend controla o acesso às páginas, mas a autorização dos dados é responsabilidade do backend.

## Configuração

Na raiz do repositório, crie `server/.env` conforme as instruções do [README do backend](../server/README.md). O arquivo `web/.env` é opcional; para usar a API, crie-o e configure:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```


## Iniciar a aplicação

Com o Docker Desktop aberto, execute na raiz do repositório:

```powershell
docker compose up
```

A interface fica disponível em `http://localhost:5173`

## Rotas

| Caminho | Tela |
| --- | --- |
| `/` | Página inicial e acesso à autenticação |
| `/dashboard` | Área principal protegida |
| `/disciplinas` | Disciplinas e tarefas associadas |
| `/materiais` | Materiais de estudo |
| `/progresso` | Indicadores e gráficos de progresso |
| `/sessoes-estudo` | Registro, edição e histórico de sessões de estudo |

As tarefas são acessadas pelo contexto das disciplinas. A página de progresso permite selecionar período semanal ou mensal. O card de tempo de estudo informa que o registro de sessões ainda não está disponível.

As sessões de estudo estão disponíveis no menu lateral. A página calcula o tempo da semana atual (segunda a domingo), do mês atual e de cada disciplina, além de permitir criar, editar e excluir registros. Os gráficos usam HTML/CSS e as cores do tema.

Como o backend ainda não oferece endpoints de sessões de estudo, `src/api/study-sessions.ts` mantém dados demonstrativos em memória, separados por usuário. As alterações sobrevivem à navegação, mas reiniciam ao recarregar a página. Em modo API, o formulário utiliza as disciplinas ativas cadastradas; em modo mock, utiliza as disciplinas de demonstração em `src/data/study-sessions.ts`. O card da página de progresso ainda depende das métricas do backend e não incorpora esses registros temporários.

Os helpers puros ficam em `src/lib/study-sessions.ts`. Para integrar a persistência real, substitua as operações `listar`, `criar`, `editar` e `excluir` da camada de API, preservando seus contratos.

## Testes

O container do frontend instala as dependências necessárias. Execute os comandos na raiz do repositório, com o Compose ativo:

```powershell
docker compose exec frontend npm run test
docker compose exec frontend npm run test:unit
```

`npm run test` executa os testes de integração com Vitest e Testing Library. `npm run test:unit` executa os testes unitários pelo runner nativo do Node.js.

Para verificar estilo e build:

```powershell
docker compose exec frontend npm run lint
docker compose exec frontend npm run build
```
