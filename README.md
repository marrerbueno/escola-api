# 📚 Escola API - Sistema de Gestão Escolar

API RESTful para gestão de boletins e presenças de alunos, construída com Node.js, Express e PostgreSQL.

## 🚀 Funcionalidades

### Gestão de Usuários
- Cadastro e autenticação (JWT)
- Controle de acesso por role (Admin, Diretor, Professor, Aluno, Pai/Mãe)
- Perfil do usuário

### Gestão de Alunos
- Cadastro completo com dados pessoais
- Vinculação com turma
- Dados do responsável

### Gestão de Professores
- Cadastro com SIAPE
- Vinculação com disciplinas
- Especialidade e formação

### Gestão de Turmas
- Criação por ano e período
- Vinculação com professor responsável
- Controle de capacidade

### Disciplinas
- Vinculação com turma e professor
- Carga horária

### Sistema de Notas
- Lançamento individual ou em lote
- Bimestral (1º, 2º, 3º, 4º)
- Tipos: Prova, Trabalho, Avaliação, Recuperação
- Cálculo automático de médias
- Boletim do aluno
- Boletim da turma

### Sistema de Presença
- Registro individual ou em lote
- Status: Presente, Ausente, Justificado, Atestado
- Estatísticas por aluno
- Presença do dia por disciplina

### Segurança
- Autenticação JWT
- Controle de acesso por role
- Rate limiting
- Headers de segurança (Helmet)
- Validação de dados (Zod)
- Logs de auditoria

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Instalação

### 1. Clonar o repositório

```bash
cd escola-api
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/escola_db"
JWT_SECRET="sua-chave-secreta-super-segura"
JWT_EXPIRES_IN="24h"
PORT=3000
```

### 4. Criar banco de dados

```sql
CREATE DATABASE escola_db;
```

### 5. Gerar migrations e schema

```bash
npx prisma generate
npx prisma db push
```

### 6. Rodar seed (dados de teste)

```bash
npm run db:seed
```

### 7. Iniciar servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 📚 Endpoints

### Autenticação

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| POST | `/api/auth/registrar` | Registrar usuário | Público |
| POST | `/api/auth/login` | Login | Público |
| GET | `/api/auth/perfil` | Obter perfil | Autenticado |
| PUT | `/api/auth/perfil` | Atualizar perfil | Autenticado |

### Alunos

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/alunos` | Listar alunos | Autenticado |
| GET | `/api/alunos/:id` | Obter aluno | Autenticado |
| GET | `/api/alunos/:id/boletim` | Boletim do aluno | Autenticado |
| POST | `/api/alunos` | Criar aluno | Admin, Diretor |
| PUT | `/api/alunos/:id` | Atualizar aluno | Admin, Diretor, Professor |
| DELETE | `/api/alunos/:id` | Remover aluno | Admin, Diretor |

### Professores

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/professores` | Listar professores | Autenticado |
| GET | `/api/professores/:id` | Obter professor | Autenticado |
| POST | `/api/professores` | Criar professor | Admin, Diretor |
| PUT | `/api/professores/:id` | Atualizar professor | Admin, Diretor |
| DELETE | `/api/professores/:id` | Remover professor | Admin, Diretor |

### Turmas

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/turmas/turmas` | Listar turmas | Autenticado |
| GET | `/api/turmas/turmas/:id` | Obter turma | Autenticado |
| POST | `/api/turmas/turmas` | Criar turma | Admin, Diretor |
| PUT | `/api/turmas/turmas/:id` | Atualizar turma | Admin, Diretor |
| DELETE | `/api/turmas/turmas/:id` | Remover turma | Admin, Diretor |

### Disciplinas

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/turmas/disciplinas` | Listar disciplinas | Autenticado |
| GET | `/api/turmas/disciplinas/:id` | Obter disciplina | Autenticado |
| POST | `/api/turmas/disciplinas` | Criar disciplina | Admin, Diretor |
| PUT | `/api/turmas/disciplinas/:id` | Atualizar disciplina | Admin, Diretor |
| DELETE | `/api/turmas/disciplinas/:id` | Remover disciplina | Admin, Diretor |

### Notas

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/notas` | Listar notas | Autenticado |
| GET | `/api/notas/media/:alunoId/:disciplinaId` | Média do aluno | Autenticado |
| GET | `/api/notas/boletim/:turmaId` | Boletim da turma | Autenticado |
| POST | `/api/notas` | Lançar nota | Professor, Admin |
| POST | `/api/notas/lote` | Lançar notas em lote | Professor, Admin |
| PUT | `/api/notas/:id` | Atualizar nota | Professor, Admin |
| DELETE | `/api/notas/:id` | Remover nota | Admin, Diretor |

### Presenças

| Método | Rota | Descrição | Acesso |
|--------|------|-----------|--------|
| GET | `/api/presencas` | Listar presenças | Autenticado |
| GET | `/api/presencas/estatisticas/:alunoId` | Estatísticas do aluno | Autenticado |
| GET | `/api/presencas/dia/:disciplinaId` | Presenças do dia | Autenticado |
| POST | `/api/presencas` | Registrar presença | Professor, Admin |
| POST | `/api/presencas/lote` | Registrar presenças em lote | Professor, Admin |
| PUT | `/api/presencas/:id` | Atualizar presença | Professor, Admin |
| DELETE | `/api/presencas/:id` | Remover presença | Admin, Diretor |

## 📊 Exemplos de Requisição

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@escola.com",
    "senha": "123456"
  }'
```

### Resposta

```json
{
  "usuario": {
    "id": "uuid",
    "email": "admin@escola.com",
    "nome": "Administrador",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Lançar Nota

```bash
curl -X POST http://localhost:3000/api/notas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "alunoId": "uuid-do-aluno",
    "disciplinaId": "uuid-da-disciplina",
    "valor": 8.5,
    "bimestre": "PRIMEIRO",
    "tipo": "PROVA",
    "descricao": "Prova Bimestral"
  }'
```

### Registrar Presença em Lote

```bash
curl -X POST http://localhost:3000/api/presencas/lote \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "disciplinaId": "uuid-da-disciplina",
    "data": "2024-03-15",
    "presencas": [
      {
        "alunoId": "uuid-aluno-1",
        "status": "PRESENTE"
      },
      {
        "alunoId": "uuid-aluno-2",
        "status": "AUSENTE"
      }
    ]
  }'
```

## 🔐 Credenciais de Teste (Seed)

| Email | Senha | Role |
|-------|-------|------|
| admin@escola.com | 123456 | ADMIN |
| diretor@escola.com | 123456 | DIRETOR |
| prof.maria@escola.com | 123456 | PROFESSOR |
| prof.joao@escola.com | 123456 | PROFESSOR |
| aluno.pedro@escola.com | 123456 | ALUNO |
| aluno.ana@escola.com | 123456 | ALUNO |
| aluno.lucas@escola.com | 123456 | ALUNO |

## 🏗️ Arquitetura

```
escola-api/
├── prisma/
│   ├── schema.prisma      # Schema do banco de dados
│   └── seed.js            # Dados de teste
├── src/
│   ├── config/
│   │   ├── database.js    # Conexão com Prisma
│   │   └── auth.js        # Configurações JWT
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── alunoController.js
│   │   ├── professorController.js
│   │   ├── turmaController.js
│   │   ├── notaController.js
│   │   └── presencaController.js
│   ├── middleware/
│   │   ├── auth.js        # Autenticação JWT
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── alunos.js
│   │   ├── professores.js
│   │   ├── turmas.js
│   │   ├── notas.js
│   │   └── presencas.js
│   ├── utils/
│   │   └── validators.js  # Validações Zod
│   └── server.js          # Servidor Express
├── .env.example
├── package.json
└── README.md
```

## 📝 Licença

MIT
