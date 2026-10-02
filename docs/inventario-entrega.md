# Inventário de entrega — 2 de outubro de 2026

Referência verificada: `origin/develop` em `5aa5111`. O estado abaixo é um
registro da auditoria nesta data; deve ser atualizado após novos merges.

## Publicação e integração

| Entrega | Publicação no GitHub | Integração em develop |
| --- | --- | --- |
| Segurança de autenticação | PR #18 | Integrado |
| Logout em todos os dispositivos | PR #19 | Aberto, CI aprovado |
| Perfil no backend | PR #11 | Integrado |
| Disciplinas, tarefas, materiais e progresso | PRs #12, #13 e #16 | Integrados |
| Validações e tratamento de erros | PR #17 | Aberto |
| Grupos e integração do perfil no frontend | `feature/grupos-integrados`, commit `e980f6a` | Sem PR aberto; exige adaptação |
| Dashboard integrado, tarefas colaborativas e eventos | `feature/dashboard-integrado`, commit `417ed2c` | Sem PR aberto; exige adaptação |

Os PRs antigos #6 e #7 foram fechados sem merge. Estar em uma branch remota
não significa fazer parte da aplicação executada em `develop`.

## Código local e duplicações

Não foram encontrados commits de branches locais ausentes de todas as
referências remotas. Há alterações sem commit em cinco worktrees antigos.

A comparação por hash dos arquivos identificou:

- Raiz / integração de dashboard: 17 dos 21 itens pendentes são idênticos à
  entrega publicada de dashboard.
- Backend antigo de tarefas/dashboard: 28 dos 30 arquivos pendentes são
  idênticos à entrega publicada de dashboard.
- Backend antigo de grupos: 15 dos 17 arquivos pendentes são idênticos à
  entrega publicada de grupos.
- Frontend antigo de grupos: 8 dos 12 itens pendentes são idênticos à entrega
  publicada de grupos.
- O worktree de auditoria tem 74 entradas pendentes e reúne cópias de várias
  funcionalidades; ele é uma referência histórica, não uma base de entrega.

As diferenças restantes incluem documentação desatualizada, finais de linha,
`tsconfig.tsbuildinfo`, textos corrigidos nos arquivos já publicados e um teste
antigo combinado de grupos/dashboard. As branches remotas já contêm testes
separados para grupos e dashboard. Não há evidência, nestas comparações, de
uma funcionalidade adicional que precise ser publicada copiando os worktrees
antigos por inteiro.

## Conflitos confirmados

Foram simulados merges com `git merge-tree --write-tree`, sem alterar branches
ou arquivos de trabalho.

Grupos conflita nos READMEs, na sidebar antiga removida e nas rotas geradas.
O código deve usar `components/layout`, preservar as páginas atuais e
regenerar as rotas após incorporar grupos e perfil. A migration de grupos
precisa ter seu encadeamento revisado contra o Alembic atual.

Dashboard também conflita em `base_command.py`, nos comandos de tarefas e no
repositório de tarefas. Seus componentes usam o layout anterior. Resolver os
marcadores de conflito não basta: modelos, contratos HTTP e migrations devem
ser adaptados à implementação atual de disciplinas/tarefas. A versão de
`develop` tem prioridade nas regras e arquitetura já integradas.

Os testes das branches antigas não comprovam a integração atual. É necessária
nova validação com PostgreSQL exclusivo de testes e o frontend adaptado.

## Sequência para a entrega

1. Incorporar o frontend de perfil à API existente, numa branch nova de
   `origin/develop`, com commits de contrato, interface e testes pertinentes.
2. Adaptar grupos/convites ao backend e ao layout atuais em sua própria branch.
   Verificar migration, isolamento entre usuários, permissões e convites.
3. Integrar o dashboard às tarefas e ao progresso existentes. Incorporar
   eventos e colaboração preservando os contratos atuais; evitar uma segunda
   implementação incompatível de tarefas.
4. Publicar cada branch validada e abrir PRs com bases e dependências explícitas.
   A revisão de #19 pode continuar enquanto perfil/grupos são preparados.
5. Após os merges, validar a aplicação consolidada: migrations em banco novo,
   cadastro/login, perfil, grupos, disciplinas, tarefas, materiais e progresso;
   depois executar testes, lint e build.
6. Atualizar instruções de instalação e variáveis de ambiente, e remover do
   versionamento artefatos gerados numa alteração de manutenção separada.

Recuperação de senha e migração para cookies ficam fora desta sequência
imediata. A prioridade é integrar e validar as funcionalidades já desenvolvidas.

## Critério de conclusão

Código publicado, PR aberto, PR integrado e aplicação validada são estados
distintos. Para a entrega final, as funcionalidades necessárias devem estar
integradas à branch de entrega acordada, com instalação reproduzível e
verificações aprovadas. Testes-fonte devem permanecer versionados; dependências
instaladas, builds, bancos e resultados temporários não são entregas de código.
