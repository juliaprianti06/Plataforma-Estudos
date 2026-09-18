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

## Conectar ao backend

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

O backend deste checkout implementa autenticação, perfil e grupos. Para iniciar
a API e o PostgreSQL, siga `server/README.md` e execute o Compose na raiz.

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

O servidor valida credenciais e sessões, usa hash de senha Argon2, tokens Bearer
com expiração e revogação, e autoriza as operações por usuário e grupo.
Configure CORS para a origem do frontend.

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

## Tela de grupos

Após entrar, acesse **Grupos** no menu ou `/groups`. A rota exige uma sessão,
assim como o dashboard.

- No modo mock, a tela começa com os seis grupos da referência.
- A busca encontra nomes, categorias e assuntos, ignorando acentos.
- **Criar grupo** mantém os campos de nome, categoria, descrição e ícone e gera
  um código de seis caracteres, com botão **Copiar**. O convite fica ativo
  apenas depois de salvar e permanece o mesmo nas edições.
- Administradores podem editar; membros podem consultar os detalhes.
- **Adicionar grupo** permite entrar pelo código recebido e também mantém o
  catálogo de grupos (exemplos no modo mock; grupos do servidor no modo API). Quem entra recebe o papel de membro; entradas
  repetidas não aumentam a contagem.
- No modo mock, os grupos e suas participações ficam em um registro compartilhado no
  localStorage, com a lista de grupos separada por usuário. Assim, dois usuários
  de demonstração no mesmo navegador podem testar o convite. Outros navegadores
  e dispositivos dependem do backend. Dados antigos são migrados ao abrir a tela.
- No modo API, a tela consulta `/groups` e persiste as operações no PostgreSQL.
  Uma conta nova começa sem grupos; falhas exibem erro e permitem tentar novamente.
  Os grupos são descobertos pelo catálogo e qualquer usuário autenticado pode entrar;
  o código de convite oferece outra forma de encontrar o grupo. Esta etapa não
  implementa grupos privados nem aprovação de pedidos de entrada.

`src/groups/api-repository.ts` implementa `GroupsRepository` com chamadas HTTP.
O servidor garante códigos únicos, cria grupo, administrador e colunas Kanban numa
transação, rejeita participação duplicada e permite edição somente ao administrador.
O catálogo retorna até 100 grupos por consulta; a busca da tela filtra a lista carregada.

## Perfil e preferências

Acesse **Ver perfil** no rodapé do menu, ou `/profile`, após entrar.

- **Perfil:** nome completo, apresentação de até 300 caracteres, até três áreas
  de interesse e foto JPG/PNG de até 5 MB. A imagem é recortada no centro e
  reduzida para 320 × 320 antes de ser armazenada. Há prévia, remoção e validação.
- **Preferências:** avisos de estudos e novidades de grupos podem ser ligados
  ou desligados. As escolhas controlam os avisos de exemplo do dashboard;
  não há envio de e-mails ou notificações do sistema.
- **Conta:** informações de acesso, download em JSON dos dados salvos do perfil
  e restauração da personalização, com confirmação, preservando os grupos.
- Nome e foto salvos aparecem no menu; a saudação do dashboard usa o nome do
  perfil. O identificador da conta continua o mesmo.
- Alterações ficam como rascunho até **Salvar alterações**. É possível descartá-las,
  e navegar para outra página com dados pendentes abre uma confirmação.

`src/profile/store.ts` mantém a validação e o armazenamento do modo mock.
No modo API, `api-store.ts` e `api-provider.ts` carregam o perfil do PostgreSQL
por endpoints autenticados. O formulário aguarda o carregamento e só confirma
alterações após a resposta do servidor. Falhas mantêm o rascunho para nova tentativa.
O nome salvo também é atualizado na sessão; nome, foto e preferências são
compartilhados entre o menu, o dashboard e a tela de perfil.

Para usar o backend local, configure `web/.env` e reinicie o Vite:

```dotenv
VITE_AUTH_MODE=api
VITE_API_URL=http://localhost:8000/api/v1
```

Os endpoints de perfil estão incluídos no backend deste checkout.
Os perfis antigos do navegador não são enviados automaticamente ao banco.
Alterações feitas em outra aba ou dispositivo aparecem após recarregar a página.

| Método | Endpoint | Ação |
| --- | --- | --- |
| GET | `/profile/me` | Carregar o perfil da sessão |
| PUT | `/profile/me` | Salvar todos os campos editáveis |
| DELETE | `/profile/me` | Restaurar apenas a personalização |
| GET | `/profile/me/export` | Baixar o perfil salvo em JSON |

Os caminhos usam a base `VITE_API_URL`. O payload mantém `name`, `bio`, `interests`,
`avatar` e `notifications: { tasks, groups }`; a resposta inclui `updatedAt`.
A exportação acrescenta o e-mail e não inclui tokens, senhas ou dados de terceiros.
As fotos ajustadas pelo navegador são validadas pela API antes de serem gravadas.
A restauração recupera o nome anterior à primeira personalização, sem remover a conta,
as sessões ou os grupos. Trocar de sessão cancela as requisições pendentes do perfil.

O e-mail permanece somente leitura. Alteração de senha, alteração/verificação de
e-mail e exclusão de conta continuam fora desta etapa.
