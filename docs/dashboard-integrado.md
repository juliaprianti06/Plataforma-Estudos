# Dashboard integrado

O dashboard usa a tabela `tarefas` existente, com os mesmos estados
`a_fazer`, `em_andamento` e `concluido`. O adapter HTTP traduz esses valores
para `todo`, `progress` e `done`, usados pelo Kanban.

## Organização

- `pages/dashboard`: interface no layout compartilhado da aplicação.
- `dashboard/api-repository.ts`: contrato do frontend com a API autenticada.
- `repository/dashboard_repository.py`: consultas de visibilidade.
- `services/tasks_service.py`: permissões e operações de colaboração sobre
  o modelo atual, usando o repositório existente para persistir tarefas.
- `services/events_service.py`: eventos e permissões de administradores.
- `routers/dashboard_router.py`: resumo, notificações e leitura do painel.

## Tarefas pessoais e de grupo

Tarefas pessoais pertencem a uma disciplina e são acessíveis apenas ao dono.
O dashboard também mostra essas tarefas e permite editá-las.

Tarefas de grupo pertencem a uma coluna Kanban e podem existir sem disciplina.
Membros ativos podem visualizar e criar tarefas. O criador torna-se responsável;
responsáveis e administradores podem editar ou excluir. As rotas pessoais
`/tarefas` não operam sobre tarefas de grupo, para preservar essas permissões.

O resumo do dashboard considera tarefas visíveis, incluindo colaboração. O
painel acadêmico de progresso mantém seu recorte atual de disciplinas pessoais;
por isso os totais das duas telas podem diferir.

`data_vencimento` continua sendo a data usada pelas telas atuais. `data_prazo`
acrescenta horário às tarefas editadas pelo dashboard. Alterar a data pela API
pessoal limpa o horário anterior. As datas de conclusão seguem a mesma regra
da API pessoal: concluir registra o horário e reabrir remove a conclusão.

## Migration

A sequência é `d10a20260923 -> g10a20260913 -> t10a20260913`.
A migration de dashboard acrescenta campos à tabela atual e cria eventos;
não recria a tabela nem elimina tarefas existentes. Uma constraint exige
disciplina ou coluna de grupo. O downgrade recusa tarefas de grupo sem
disciplina, pois converter esses dados automaticamente perderia informação.

## Validação

Os testes cobrem leitura de tarefas pessoais, tarefas colaborativas,
permissões, isolamento entre contas, datas de conclusão, eventos, preferências
de notificação e preservação dos dados na migration. O frontend valida
respostas e cancela requisições quando a sessão muda.
