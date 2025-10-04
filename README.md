Projeto Fidelidade

Sistema de cartão fidelidade para estabelecimentos, permitindo cadastro e gerenciamento de clientes, controle de pontos, geração de QR Code para consulta, envio de vouchers e verificação de assinatura mensal.

Índice

Descrição

Funcionalidades

Tecnologias

Arquitetura

Instalação

Configuração

Banco de Dados

Scripts Disponíveis

Endpoints da API

Front‑end

Deploy

Como Contribuir

Licença

Contato

Descrição

Este projeto implementa um sistema de fidelização de clientes para estabelecimentos comerciais. O administrador pode cadastrar clientes, consultar e atualizar pontos, enviar vouchers via WhatsApp e verificar a assinatura mensal do estabelecimento. Inclui também geração dinâmica de QR Code para que clientes consultem seus pontos sem precisar de login.

Funcionalidades

Autenticação via JWT

Verificação de assinatura mensal (expira a cada 30 dias)

CRUD de clientes (criar, listar, atualizar, deletar)

Atribuição e zeramento de pontos

Envio de vouchers personalizados via WhatsApp

Geração de QR Code para página de consulta de pontos

Tema customizável por estabelecimento (cores, logo)

Front‑end estático em HTML/CSS/JS para painel de administração e consulta pública

Tecnologias

Back‑end: Node.js, Express, Prisma (MySQL)

Auth & Payment: JSON Web Tokens (JWT), middleware de verificação de assinatura

QR Code: biblioteca qrcode

Front‑end: HTML5, CSS3, JavaScript puro (Fetch API)

Deploy: Railway (configuração em railway.toml)

Arquitetura

 client (browser)  ↔  public/app.js  ↔  API REST (Express)
                                    ├─ /api/login (auth)
                                    ├─ /api/establishments (tema, QR, voucher-message)
                                    ├─ /api/clients (CRUD, pontos, reset, check)
                                    └─ /api/voucher (número+mensagem, reset-points)

 database (MySQL) ←─ Prisma ORM ── models: Client, Establishment, User

Instalação

Clone o repositório:

git clone https://github.com/DouglasMoraesDev/projeto-fidelidade.git
cd projeto-fidelidade

Instale dependências:

npm install

Configuração

Crie um arquivo .env na raiz com as variáveis abaixo:

# Conexão ao MySQL
DATABASE_URL="mysql://USER:PASS@HOST:PORT/DATABASE"

# Chave secreta para JWT
JWT_SECRET="sua_chave_secreta"

# Base URL para geração de QR e links (ex: https://seu-app.up.railway.app)
BASE_URL="https://seu-domínio.com"

# Porta da API (opcional)
PORT=3000

Banco de Dados

Usamos Prisma para migrações e cliente ORM:

Modelo Client: clientes e pontos

Modelo Establishment: dados de tema, voucherMessage, lastPaymentDate

Modelo User: credenciais, estabelece relação com Establishment

Para gerar e rodar migrações:

npm run prisma:generate
npm run prisma:migrate

Scripts Disponíveis

npm run dev — inicia servidor com nodemon

npm start — inicia servidor em modo de produção

npm run prisma:generate — gera cliente Prisma

npm run prisma:migrate — aplica migrações no banco

Endpoints da API

Autenticação

Método

Rota

Descrição

POST

/api/login

Faz login e retorna JWT + tema

Estabelecimento (público)

Método

Rota

Descrição

GET

/api/establishments/:id

Retorna dados de tema e cores do estabelecimento

GET

/api/establishments/:id/qrcode

Gera e retorna PNG do QR Code

GET

/api/establishments/:id/voucher-message

Retorna mensagem de voucher customizada

Clientes (protegido)

Método

Rota

Descrição

GET

/api/clients?establishmentId=ID

Lista clientes do estabelecimento

POST

/api/clients

Cria novo cliente (body: fullName, phone, email?, points?, establishmentId)

PUT

/api/clients/:id

Atualiza cliente

DELETE

/api/clients/:id?establishmentId=ID

Exclui cliente

POST

/api/clients/:id/points

Adiciona pontos (body: pointsToAdd, establishmentId)

PUT

/api/clients/:id/reset

Zera pontos (body: establishmentId)

POST

/api/clients/check-points

Verifica pontos (body: phone, establishmentId)

Voucher (protegido)

Método

Rota

Descrição

GET

/api/voucher/:clienteId

Retorna número WhatsApp e mensagem do voucher

PUT

/api/voucher/reset-points/:clienteId

Zera pontos após envio de voucher

Nota: rotas protegidas exigem header Authorization: Bearer <token> e assinatura válida.

Front‑end

Arquivos estáticos em /public:

index.html — painel de administração (login, CRUD clientes, pontos, QR)

payment.html — página de renovação de assinatura

points.html — consulta pública de pontos por telefone e establishmentId

app.js — lógica de interação com API e tratamento de temas e erros

Deploy

Configuração para Railway disponível no railway.toml. Basta conectar o projeto e definir variáveis de ambiente conforme .env.

Como Contribuir

Faça fork do repositório

Crie uma branch com a feature (git checkout -b feature/new-feature)

Commit suas mudanças (git commit -m 'feat: descrição')

Push para a branch (git push origin feature/new-feature)

Abra um Pull Request

Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

Contato

Desenvolvedor:@DouglasMoraesDev

GitHub: DouglasMoraesDev

Email: doougmooraes2024@gmail.com

Boa codificação!

# appfidelidade
