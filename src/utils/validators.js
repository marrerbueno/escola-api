const { z } = require('zod');

// Validação de cadastro de usuário
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  role: z.enum(['ADMIN', 'DIRETOR', 'PROFESSOR', 'ALUNO', 'PAI_MAE']).optional(),
});

// Validação de login
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

// Validação de aluno
const alunoSchema = z.object({
  usuarioId: z.string().uuid('ID de usuário inválido'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  nomeCompleto: z.string().min(2, 'Nome completo é obrigatório'),
  dataNascimento: z.string().or(z.date()),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  turmaId: z.string().uuid().optional(),
  responsavelNome: z.string().optional(),
  responsavelTel: z.string().optional(),
  responsavelEmail: z.string().email().optional(),
});

// Validação de professor
const professorSchema = z.object({
  usuarioId: z.string().uuid('ID de usuário inválido'),
  siape: z.string().min(1, 'SIAPE é obrigatório'),
  nomeCompleto: z.string().min(2, 'Nome completo é obrigatório'),
  especialidade: z.string().optional(),
  formacao: z.string().optional(),
});

// Validação de turma
const turmaSchema = z.object({
  nome: z.string().min(1, 'Nome da turma é obrigatório'),
  ano: z.number().int().min(2020).max(2030),
  periodo: z.enum(['MANHA', 'TARDE', 'NOITE']),
  capacidade: z.number().int().min(1).max(60).optional(),
  professorId: z.string().uuid().optional(),
});

// Validação de disciplina
const disciplinaSchema = z.object({
  nome: z.string().min(1, 'Nome da disciplina é obrigatório'),
  turmaId: z.string().uuid('ID de turma inválido'),
  professorId: z.string().uuid('ID de professor inválido'),
  cargaHoraria: z.number().int().min(1).max(200).optional(),
});

// Validação de nota
const notaSchema = z.object({
  alunoId: z.string().uuid('ID de aluno inválido'),
  disciplinaId: z.string().uuid('ID de disciplina inválido'),
  valor: z.number().min(0, 'Nota não pode ser negativa').max(10, 'Nota máxima é 10'),
  bimestre: z.enum(['PRIMEIRO', 'SEGUNDO', 'TERCEIRO', 'QUARTO']),
  tipo: z.enum(['PROVA', 'TRABALHO', 'AVALIACAO', 'RECUPERACAO']).optional(),
  descricao: z.string().optional(),
});

// Validação de presença
const presencaSchema = z.object({
  alunoId: z.string().uuid('ID de aluno inválido'),
  disciplinaId: z.string().uuid('ID de disciplina inválido'),
  data: z.string().or(z.date()),
  status: z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATASDO']),
  observacao: z.string().optional(),
});

// Validação de presença em lote
const presencaLoteSchema = z.object({
  disciplinaId: z.string().uuid('ID de disciplina inválido'),
  data: z.string().or(z.date()),
  presencas: z.array(z.object({
    alunoId: z.string().uuid('ID de aluno inválido'),
    status: z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO', 'ATASDO']),
    observacao: z.string().optional(),
  })).min(1, 'Debe haver pelo menos uma presença'),
});

module.exports = {
  usuarioSchema,
  loginSchema,
  alunoSchema,
  professorSchema,
  turmaSchema,
  disciplinaSchema,
  notaSchema,
  presencaSchema,
  presencaLoteSchema,
};
