# Plataforma de Estudos Colaborativos

Plataforma web para organização acadêmica e colaboração entre estudantes. O sistema reúne gerenciamento de disciplinas e tarefas, quadro Kanban, acompanhamento de progresso, armazenamento de materiais e grupos de estudo em um único ambiente.

> **Status:** em desenvolvimento — planejamento organizado em quatro sprints.

## Sumário

- [Visão geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Como executar](#como-executar)
- [Product Backlog](#product-backlog)
- [Padrões de projeto](#padrões-de-projeto)
- [Critérios de priorização](#critérios-de-priorização)

## Visão geral

O projeto tem como objetivo apoiar estudantes na organização de sua rotina acadêmica e facilitar a troca de conhecimento. A evolução da plataforma está dividida em quatro sprints, definidas conforme a prioridade, as dependências técnicas e o valor entregue ao usuário.

### Principais funcionalidades planejadas

- Cadastro, autenticação e gerenciamento de perfil;
- Organização de disciplinas e tarefas;
- Quadro Kanban com movimentação por *drag-and-drop*;
- Dashboard e acompanhamento de progresso;
- Upload e compartilhamento de materiais;
- Criação e administração de grupos de estudo;
- Calendário, notificações, busca e estatísticas.

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, TanStack Router e DnD Kit|
| Backend | Python, FastAPI, SQLAlchemy e Alembic |
| Banco de dados | PostgreSQL |
| Autenticação | JWT e hash seguro de senhas |
| Infraestrutura | Docker e Docker Compose |

## Como executar

### Pré-requisitos

- [Docker](https://www.docker.com/) com Docker Compose;
- Git.

### Configuração

1. Clone o repositório e acesse a pasta do projeto:

   ```bash
   git clone https://github.com/juliaprianti06/Lab-Engenharia-Software.git
   cd Lab-Engenharia-Software
   ```

2. Crie os arquivos de ambiente a partir dos exemplos:

   ```bash
   cp server/.env.example server/.env
   cp web/.env.example web/.env
   ```

3. Revise as variáveis de ambiente e inicie os serviços:

   ```bash
   docker compose up --build
   ```

4. Acesse os serviços:

   - Aplicação web: <http://localhost:5173>
   - API: <http://localhost:8000>
   - Documentação da API: <http://localhost:8000/docs>

## Product Backlog

O Product Backlog reúne as funcionalidades planejadas para o projeto. Cada sprint contém um conjunto de histórias selecionadas de acordo com prioridade, dependências e evolução esperada do sistema.

### Níveis de prioridade

| Nível | Descrição |
|---|---|
| 🔴 **Crítica** | Essencial para a proposta principal ou para o funcionamento do sistema. |
| 🟠 **Alta** | Importante, mas sua ausência temporária não impede completamente o uso da plataforma. |
| 🟡 **Média** | Melhora significativamente a experiência, podendo ser implementada após o núcleo do sistema. |
| 🟢 **Baixa** | Complementar e condicionada à disponibilidade no cronograma. |

### Resumo das sprints

| Sprint | Foco |
|---|---|
| Sprint 1 | Autenticação, segurança, responsividade, disciplinas e tarefas |
| Sprint 2 | Kanban, dashboard, progresso, filtros e materiais |
| Sprint 3 | Grupos, membros, permissões e compartilhamento |
| Sprint 4 | Calendário, notificações, busca, estatísticas, testes e documentação |

---

### Sprint 1 — Fundação da plataforma

#### Objetivo

Construir a base funcional da aplicação, permitindo que usuários criem uma conta, realizem autenticação e organizem disciplinas e tarefas. Desde a primeira entrega, a aplicação deverá oferecer mecanismos de segurança e uma interface responsiva.

| ID | História de usuário | Prioridade | Pontos |
|---|---|:---:|---:|
| US01 | Como estudante, quero me cadastrar para criar minha conta na plataforma. | 🔴 Crítica | 5 |
| US02 | Como estudante, quero fazer login e logout para acessar minha área pessoal com segurança. | 🔴 Crítica | 5 |
| US03 | Como estudante, quero cadastrar e visualizar disciplinas para organizar meus estudos por matéria. | 🟠 Alta | 5 |
| US04 | Como estudante, quero criar e visualizar tarefas relacionadas às disciplinas para organizar minhas atividades acadêmicas. | 🔴 Crítica | 8 |
| US05 | Como estudante, quero editar, excluir e concluir minhas tarefas para manter minha organização atualizada. | 🟠 Alta | 5 |
| US06 | Como estudante, quero que meus dados e recursos sejam protegidos contra acessos não autorizados. | 🔴 Crítica | 8 |
| US07 | Como estudante, quero utilizar uma interface responsiva para acessar corretamente a plataforma em desktop e tablet. | 🟠 Alta | 5 |
| US08 | Como estudante, quero visualizar e editar meu perfil para manter meus dados atualizados. | 🟡 Média | 3 |

#### Requisitos técnicos

- Estruturas iniciais do frontend em React e do backend em FastAPI;
- Configuração do PostgreSQL e modelagem inicial das entidades;
- API REST com validação de dados e tratamento padronizado de erros;
- Autenticação JWT, hash seguro de senhas e proteção de rotas;
- Controle de acesso aos recursos;
- Repository Pattern e conexão centralizada com o banco de dados;
- Layout principal, componentes reutilizáveis e responsividade para desktop e tablet.

#### Resultado esperado

Ao final da Sprint 1, deverá ser possível executar o fluxo:

```text
Cadastro → Login → Disciplinas → Tarefas → Perfil → Logout
```

---

### Sprint 2 — Organização acadêmica e materiais

#### Objetivo

Expandir as ferramentas de organização acadêmica e implementar o armazenamento de materiais, uma das funcionalidades centrais da plataforma.

| ID | História de usuário | Prioridade | Pontos |
|---|---|:---:|---:|
| US09 | Como estudante, quero organizar minhas tarefas em um quadro Kanban para acompanhar seu andamento. | 🔴 Crítica | 8 |
| US10 | Como estudante, quero movimentar tarefas entre as etapas do Kanban utilizando *drag-and-drop*. | 🟠 Alta | 5 |
| US11 | Como estudante, quero enviar materiais de estudo para armazenar conteúdos acadêmicos na plataforma. | 🔴 Crítica | 8 |
| US12 | Como estudante, quero visualizar e baixar materiais armazenados para acessá-los posteriormente. | 🟠 Alta | 5 |
| US13 | Como estudante, quero visualizar um dashboard com um resumo das minhas atividades acadêmicas. | 🟠 Alta | 8 |
| US14 | Como estudante, quero filtrar e ordenar minhas tarefas para encontrar atividades importantes com maior facilidade. | 🟡 Média | 5 |
| US15 | Como estudante, quero acompanhar meu progresso por disciplina para visualizar minha evolução acadêmica. | 🟡 Média | 5 |

#### Quadro Kanban

O quadro terá inicialmente as colunas **A fazer**, **Em andamento** e **Concluído**. Ao mover uma tarefa, seu status deverá ser atualizado e persistido no banco de dados.

O recurso de *drag-and-drop* será implementado com DnD Kit. O Command Pattern poderá ser aplicado às operações realizadas sobre os cartões.

#### Filtros e ordenação

As tarefas poderão ser filtradas por disciplina, status, prioridade, atraso e conclusão. A ordenação estará disponível por prazo mais próximo, prazo mais distante, maior prioridade e data de criação.

#### Gerenciamento de materiais

O sistema aceitará arquivos PDF, DOCX, PPTX, TXT e imagens. Cada material deverá registrar:

- Nome, tipo e tamanho;
- Usuário responsável e data de envio;
- Disciplina relacionada;
- Localização ou URL do arquivo.

O módulo deverá oferecer validação de extensão e tamanho, upload, download, consulta, exclusão e associação entre material e disciplina.

#### Dashboard

O dashboard apresentará quantidade de disciplinas, tarefas pendentes, concluídas e atrasadas, próximos prazos e progresso acadêmico.

#### Resultado esperado

Ao final da Sprint 2, o usuário deverá conseguir organizar tarefas visualmente, acompanhar sua situação acadêmica e armazenar materiais relacionados às disciplinas.

---

### Sprint 3 — Colaboração entre usuários

#### Objetivo

Adicionar recursos colaborativos à plataforma, permitindo que estudantes participem de grupos e compartilhem materiais.

| ID | História de usuário | Prioridade | Pontos |
|---|---|:---:|---:|
| US16 | Como estudante, quero criar grupos de estudo para colaborar com outros usuários. | 🔴 Crítica | 5 |
| US17 | Como estudante, quero entrar e sair de grupos de estudo para participar de comunidades relacionadas aos meus estudos. | 🟠 Alta | 5 |
| US18 | Como administrador, quero gerenciar os membros do meu grupo. | 🟠 Alta | 5 |
| US19 | Como administrador, quero controlar as permissões dos integrantes do grupo. | 🟠 Alta | 5 |
| US20 | Como estudante, quero compartilhar materiais armazenados com os integrantes dos meus grupos. | 🔴 Crítica | 5 |
| US21 | Como estudante, quero acessar e baixar materiais compartilhados pelos demais membros. | 🟠 Alta | 3 |
| US22 | Como estudante, quero comentar em materiais para discutir conteúdos com outros integrantes. | 🟢 Baixa | 5 |

#### Grupos de estudo

Cada grupo deverá possuir nome, descrição, administrador, membros, disciplina ou tema relacionado, materiais compartilhados e data de criação.

O ingresso poderá ocorrer por código, link ou convite enviado por outro usuário.

#### Permissões

| Perfil | Permissões |
|---|---|
| **Administrador** | Editar o grupo, adicionar ou remover membros, gerenciar convites, materiais e permissões. |
| **Membro** | Visualizar o grupo, compartilhar, visualizar e baixar materiais e, quando disponível, comentar. |

#### Compartilhamento de materiais

O upload criado na Sprint 2 será expandido para permitir o compartilhamento com membros autorizados:

```text
Usuário → Upload do material → Grupo → Membros autorizados
```

#### Resultado esperado

Ao final da Sprint 3, a aplicação evoluirá de um organizador acadêmico individual para uma plataforma com recursos efetivos de estudo colaborativo.

---

### Sprint 4 — Recursos complementares e finalização

#### Objetivo

Adicionar funcionalidades secundárias, melhorar a experiência de uso e preparar a aplicação para entrega e apresentação.

| ID | História de usuário | Prioridade | Pontos |
|---|---|:---:|---:|
| US23 | Como estudante, quero visualizar um calendário com meus compromissos acadêmicos. | 🟡 Média | 8 |
| US24 | Como estudante, quero receber notificações sobre prazos e acontecimentos importantes. | 🟡 Média | 5 |
| US25 | Como estudante, quero pesquisar tarefas, disciplinas, grupos e materiais. | 🟢 Baixa | 3 |
| US26 | Como estudante, quero visualizar estatísticas sobre minhas atividades acadêmicas. | 🟢 Baixa | 5 |
| US27 | Como equipe de desenvolvimento, queremos testar os principais fluxos da aplicação para garantir seu funcionamento. | 🟠 Alta | 8 |
| US28 | Como equipe de desenvolvimento, queremos documentar a API e o projeto para facilitar manutenção, execução e apresentação. | 🟠 Alta | 5 |

#### Calendário e notificações

O calendário poderá exibir tarefas, provas, trabalhos, apresentações e eventos acadêmicos. As notificações serão inicialmente internas e poderão alertar sobre prazos próximos, atrasos, convites para grupos e novos materiais compartilhados.

#### Busca e estatísticas

A busca localizará disciplinas, tarefas, grupos e materiais. As estatísticas poderão apresentar tarefas concluídas, pendentes e atrasadas, taxa de conclusão e progresso por disciplina.

#### Qualidade e testes

Antes da entrega final, deverão ser testados os principais fluxos da aplicação:

- Cadastro, login, logout e controle de acesso;
- Disciplinas, tarefas e Kanban;
- Upload e download de materiais;
- Grupos, permissões e compartilhamento;
- Responsividade da interface.

#### Documentação

A documentação deverá conter descrição e arquitetura do projeto, tecnologias, integrantes, estrutura do banco de dados, instalação, execução, variáveis de ambiente, API, funcionalidades, organização das pastas e padrões de projeto.

#### Resultado esperado

Ao final da Sprint 4, a plataforma deverá estar testada, documentada e preparada para entrega, demonstração e continuidade do desenvolvimento.

## Funcionalidades críticas

As funcionalidades críticas representam o produto mínimo esperado e têm precedência sobre recursos complementares:

1. Cadastro de usuários;
2. Login e autenticação;
3. Gerenciamento básico de tarefas;
4. Segurança e controle de acesso;
5. Quadro Kanban;
6. Upload de materiais;
7. Criação de grupos de estudo;
8. Compartilhamento de materiais entre usuários.

## Padrões de projeto

### Repository Pattern

Separa o acesso ao banco de dados (consultas e leituras) das regras de negócio e rotas da API, facilitando a manutenção e a criação de testes isolados.

### Command Pattern

Aplicado para encapsular operações de escrita e regras de negócio complexas, como a criação de disciplinas e a movimentação de cartões no Kanban (alteração de status das tarefas). Isso garante rastreabilidade e isola a lógica de negócio dos *controllers*.

### Injeção de Dependência (Dependency Injection) e Connection Pool

Em substituição ao padrão Singleton clássico, o projeto utiliza a injeção de dependência nativa do FastAPI (`Depends`) aliada ao gerenciamento de *Pool* de conexões do SQLAlchemy. Isso garante que as conexões com o banco de dados sejam distribuídas, abertas e fechadas de forma altamente escalável e segura durante o ciclo de vida das requisições, sem sobrecarregar o banco.

## Critérios de priorização

A equipe deverá desenvolver as funcionalidades na seguinte ordem:

1. Funcionalidades críticas não concluídas;
2. Funcionalidades de alta prioridade;
3. Funcionalidades de média prioridade;
4. Funcionalidades de baixa prioridade.

Funcionalidades complementares não deverão ser priorizadas enquanto houver funcionalidades críticas incompletas.

---

Desenvolvido como projeto da disciplina de Laboratório de Engenharia de Software.
