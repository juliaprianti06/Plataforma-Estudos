# Integração validada — 2 de outubro de 2026

Este relatório atualiza o inventário inicial. A branch
`integration/entrega-validada` reúne as entregas abaixo para validação conjunta;
ela não substitui os PRs individuais nem representa merges já aprovados em
`develop`. Base remota verificada: `5aa5111`.

## Organização e revisão

| Entrega | PR | Base |
| --- | --- | --- |
| Logout global | [#19](https://github.com/juliaprianti06/Plataforma-Estudos/pull/19) | develop |
| Inventário | [#20](https://github.com/juliaprianti06/Plataforma-Estudos/pull/20) | develop |
| Perfil integrado ao layout atual | [#21](https://github.com/juliaprianti06/Plataforma-Estudos/pull/21) | develop |
| Grupos e convites | [#22](https://github.com/juliaprianti06/Plataforma-Estudos/pull/22) | develop |
| Dashboard, tarefas e eventos | [#23](https://github.com/juliaprianti06/Plataforma-Estudos/pull/23) | feat/grupos-alinhados-develop |
| Higiene dos artefatos gerados | [#24](https://github.com/juliaprianti06/Plataforma-Estudos/pull/24) | develop |

Após integrar #22, mudar a base de #23 para `develop` e verificar novamente
o diff e o CI. As outras entregas de código podem ser revisadas separadamente.
Na consulta realizada, #19 e #21–#24 estavam sem conflitos com suas bases;
os checks existentes de #19, #22 e #23 passaram. #21 e #24 não apresentavam
check-runs nessa consulta.

Foram preservados o layout compartilhado, os comandos e a modelagem atuais
de `develop`. As migrations de grupos e dashboard formam uma única sequência.
O conflito nas rotas geradas foi resolvido regenerando o arquivo com ambas
as páginas presentes. Não foram copiados caches de build ou worktrees antigos.

## Verificações locais da versão consolidada

- Backend: **120 testes aprovados**, com PostgreSQL 16 exclusivo de testes.
- Frontend: **52 testes unitários e 6 de integração aprovados**.
- `npm run lint` e `npm run build`: aprovados.
- Banco novo: `alembic upgrade head` chegou à migration `t10a20260913`.
- HTTP real: cadastro, `/auth/me`, `/profile/me`, `/groups` e `/dashboard`
  responderam corretamente; logout global respondeu 204, e a sessão revogada
  recebeu 401 em `/auth/me`.
- A preservação de tarefas anteriores e o isolamento das tarefas de grupos
  são cobertos pelos testes de migration e de permissões.

A execução de testes do backend utiliza a imagem de testes e PostgreSQL
descartável, conforme os testes existentes. No frontend, instalar com `npm ci`
e executar `npm run test:unit`, `npm test`, `npm run lint` e
`npm run build`. Consultar `web/package.json` para os scripts disponíveis.

O build ainda avisa sobre um bundle maior que 500 kB. Também existem avisos
de depreciação das ferramentas de teste; nenhum impediu as verificações.
O teste visual automatizado pelo navegador foi **inconclusivo** e não está
sendo considerado aprovado. Falta a navegação manual ponta a ponta.

## Pendências para a entrega final

1. Revisar e integrar os PRs; revalidar a `develop` resultante.
2. Conferir cadastro/login, perfil, grupos/convites, tarefas pessoais e de
   grupos, eventos, disciplinas, materiais e progresso no navegador.
3. Validar o ambiente definitivo de execução, suas variáveis e migrations;
   os testes acima não comprovam configuração de produção.
4. Atualizar as instruções de instalação conforme o ambiente escolhido.

As alterações antigas sem commit foram preservadas. O inventário anterior
identifica cópias das entregas já publicadas, caches e documentação antiga;
elas não foram incluídas indiscriminadamente nos PRs. A `develop` local
está em um worktree limpo, `.worktrees/develop-alinhada`; a versão consolidada
fica em `.worktrees/entrega-validada`. A raiz continua na branch antiga,
com as alterações do usuário intactas.

Recuperação de senha e migração para cookies continuam fora desta etapa.
Para os detalhes da compatibilidade de tarefas, consultar
[dashboard-integrado.md](dashboard-integrado.md).
