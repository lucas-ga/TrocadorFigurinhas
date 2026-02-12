# 🎴 TrocadorFigurinhas

Plataforma para troca e compra/venda de figurinhas do álbum da Copa do Mundo 2026.

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Sobre o Projeto

O **TrocadorFigurinhas** é uma solução para um problema comum entre colecionadores de figurinhas: encontrar outras pessoas para trocar as repetidas e conseguir as que faltam para completar o álbum.

### Funcionalidades

- ✅ **Cadastro de Usuários** - Crie sua conta e gerencie seu perfil
- ✅ **Gestão de Coleção** - Marque quais figurinhas você tem e quais precisa
- ✅ **Sistema de Match** - Encontre pessoas compatíveis para troca
- ✅ **Propostas de Troca** - Envie e receba propostas de troca
- ✅ **Sistema de Reputação** - Avalie outros usuários após as trocas
- ✅ **Notificações** - Fique por dentro de novas propostas e matches
- ✅ **Filtro por Localização** - Encontre trocas na sua região

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** com **PostgreSQL**
- **JWT** para autenticação
- **Express Validator** para validações

### Frontend
- **React 18** + **TypeScript**
- **Vite** para build
- **Tailwind CSS** para estilização
- **React Query** para gerenciamento de estado
- **Zustand** para estado global
- **React Router** para navegação

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/TrocadorFigurinhas.git
cd TrocadorFigurinhas
```

### 2. Configure o Backend

```bash
# Entre na pasta do backend
cd backend

# Instale as dependências
npm install

# Copie o arquivo de ambiente
cp .env.example .env

# Configure o .env com suas credenciais do PostgreSQL
# DATABASE_URL="postgresql://usuario:senha@localhost:5432/trocador_figurinhas"

# Gere o cliente Prisma
npx prisma generate

# Execute as migrations
npx prisma migrate dev

# Popule o banco com as figurinhas do álbum
npm run seed
```

### 3. Configure o Frontend

```bash
# Em outro terminal, entre na pasta do frontend
cd frontend

# Instale as dependências
npm install
```

### 4. Execute o projeto

```bash
# Na raiz do projeto, execute ambos ao mesmo tempo
npm install # instala concurrently
npm run dev

# Ou execute separadamente:
# Terminal 1 (backend):
cd backend && npm run dev

# Terminal 2 (frontend):
cd frontend && npm run dev
```

### 5. Acesse

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001/api

## 📁 Estrutura do Projeto

```
TrocadorFigurinhas/
├── backend/
│   ├── src/
│   │   ├── database/        # Seed do banco de dados
│   │   ├── lib/             # Instância do Prisma
│   │   ├── middlewares/     # Auth e error handlers
│   │   ├── routes/          # Rotas da API
│   │   └── server.ts        # Entry point
│   ├── prisma/
│   │   └── schema.prisma    # Modelo do banco
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── services/        # API client
│   │   ├── stores/          # Estado global (Zustand)
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx         # Entry point
│   └── package.json
└── package.json             # Workspaces config
```

## 🔌 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login

### Usuários
- `GET /api/users/me` - Perfil do usuário logado
- `PUT /api/users/me` - Atualizar perfil
- `GET /api/users/:nickname` - Perfil público
- `POST /api/users/:id/rate` - Avaliar usuário

### Figurinhas
- `GET /api/stickers/albums` - Lista álbuns
- `GET /api/stickers/albums/:id` - Detalhes do álbum
- `GET /api/stickers/albums/:id/stickers` - Figurinhas do álbum
- `GET /api/stickers/my-collection` - Minhas figurinhas
- `POST /api/stickers/my-collection` - Adicionar figurinha
- `GET /api/stickers/my-wanted` - Lista de desejadas
- `POST /api/stickers/my-wanted` - Adicionar desejada

### Trocas
- `GET /api/trades` - Minhas trocas
- `POST /api/trades` - Criar proposta
- `PUT /api/trades/:id/accept` - Aceitar troca
- `PUT /api/trades/:id/reject` - Recusar troca
- `PUT /api/trades/:id/complete` - Concluir troca

### Match
- `GET /api/match/find` - Encontrar matches
- `GET /api/match/sticker/:id` - Quem tem essa figurinha
- `GET /api/match/user/:id/compatible` - Compatibilidade com usuário

## 🗄️ Modelo de Dados

- **User** - Usuários da plataforma
- **Album** - Álbuns de figurinhas (Copa 2026)
- **Section** - Seções do álbum (seleções, estádios, etc.)
- **Sticker** - Figurinhas individuais
- **UserSticker** - Figurinhas que o usuário tem
- **UserWantedSticker** - Figurinhas que o usuário precisa
- **Trade** - Propostas de troca
- **TradeItem** - Itens de uma troca
- **Rating** - Avaliações entre usuários
- **Notification** - Notificações do sistema

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: minha feature'`)
4. Push para a Branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 💡 Próximos Passos

- [ ] Chat em tempo real entre usuários
- [ ] Integração com redes sociais
- [ ] Sistema de pagamento para vendas
- [ ] App mobile (React Native)
- [ ] Sistema de geolocalização para trocas presenciais
- [ ] Notificações push
- [ ] Dark mode

---

Feito com ❤️ para colecionadores de figurinhas 🎴
