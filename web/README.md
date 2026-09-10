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

## Conectar ao backend depois

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

**O backend de autenticação ainda precisa ser implementado.** Os arquivos
`server/app/routers/auth_router.py`, `services/auth_service.py` e
`schemas/usuario_schema.py` estão vazios, e o router está comentado em
`server/app/main.py`. Configurar a URL não implementa essas rotas.

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

No servidor, conecte router → serviço de autenticação → repositório de usuários
→ banco de dados. Implemente validação, hash de senha, unicidade de e-mail,
emissão/validação/expiração/revogação de tokens e autorização em todas as rotas
privadas. Configure CORS para a origem do frontend.

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
  catálogo de demonstração. Quem entra recebe o papel de membro; entradas
  repetidas não aumentam a contagem.
- Os grupos e suas participações ficam em um registro compartilhado no
  localStorage, com a lista de grupos separada por usuário. Assim, dois usuários
  de demonstração no mesmo navegador podem testar o convite. Outros navegadores
  e dispositivos dependem do backend. Dados antigos são migrados ao abrir a tela.
- No modo API, os grupos de exemplo não são carregados; as operações de grupos
  continuam locais até a implementação do backend de grupos.

A interface `GroupsRepository`, em `src/groups/repository.ts`, define
`list`, `discover`, `create`, `update`, `join` e `joinByCode`. Para integrar ao banco,
implemente um repositório HTTP com esse contrato e troque a criação do
repositório em `src/components/groups/groups-page.tsx`. O servidor deverá
validar participação e permissões de administrador; as verificações locais
servem apenas para o protótipo. A API deverá garantir a unicidade dos códigos
  e registrar a entrada e a contagem de membros numa única transação.

## Perfil e preferências

Acesse **Ver perfil** no rodapé do menu, ou `/profile`, após entrar.

- **Perfil:** nome completo, apresentação de até 300 caracteres, até três áreas
  de interesse e foto JPG/PNG de até 5 MB. A imagem é recortada no centro e
  reduzida para 320 × 320 antes de ser armazenada. Há prévia, remoção e validação.
- **Preferências:** avisos de estudos e novidades de grupos podem ser ligados
  ou desligados. As escolhas controlam as notificações de exemplo no dashboard;
  não há envio de e-mails ou notificações do sistema.
- **Conta:** informações de acesso, download em JSON dos dados salvos do perfil
  e restauração da personalização, com confirmação, preservando os grupos.
- Nome e foto salvos aparecem no menu; a saudação do dashboard usa o nome do
  perfil. O identificador da conta continua o mesmo.
- Alterações ficam como rascunho até **Salvar alterações**. É possível descartá-las,
  e navegar para outra página com dados pendentes abre uma confirmação.

`src/profile/store.ts` mantém somente os campos permitidos, com validação e
persistência separada por usuário e modo de autenticação. `use-profile.ts`
compartilha as mudanças entre componentes. Os dados ficam locais, inclusive
no modo API, até implementar a leitura e a gravação do perfil no backend.
A atualização em outra aba será carregada após recarregar essa aba.

O e-mail de acesso é somente leitura. Alteração de senha, alteração/verificação
de e-mail e exclusão de conta não são simuladas como operações reais. Na integração
futura, precisam de endpoints autenticados no servidor. A API de perfil deverá
validar a propriedade dos dados e armazenar a foto em um serviço de arquivos.
O download do perfil não inclui tokens, senhas nem informações de outros usuários.
