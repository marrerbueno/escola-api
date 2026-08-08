const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Criar senha padrão
  const senhaHash = await bcrypt.hash('123456', 10);

  // ============================================
  // CRIAR USUÁRIOS
  // ============================================

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@escola.com' },
    update: {},
    create: {
      email: 'admin@escola.com',
      senha: senhaHash,
      nome: 'Administrador',
      role: 'ADMIN',
    },
  });

  const diretor = await prisma.usuario.upsert({
    where: { email: 'diretor@escola.com' },
    update: {},
    create: {
      email: 'diretor@escola.com',
      senha: senhaHash,
      nome: 'Diretor da Escola',
      role: 'DIRETOR',
    },
  });

  const professor1 = await prisma.usuario.upsert({
    where: { email: 'prof.maria@escola.com' },
    update: {},
    create: {
      email: 'prof.maria@escola.com',
      senha: senhaHash,
      nome: 'Maria Silva',
      role: 'PROFESSOR',
    },
  });

  const professor2 = await prisma.usuario.upsert({
    where: { email: 'prof.joao@escola.com' },
    update: {},
    create: {
      email: 'prof.joao@escola.com',
      senha: senhaHash,
      nome: 'João Santos',
      role: 'PROFESSOR',
    },
  });

  const aluno1 = await prisma.usuario.upsert({
    where: { email: 'aluno.pedro@escola.com' },
    update: {},
    create: {
      email: 'aluno.pedro@escola.com',
      senha: senhaHash,
      nome: 'Pedro Costa',
      role: 'ALUNO',
    },
  });

  const aluno2 = await prisma.usuario.upsert({
    where: { email: 'aluno.ana@escola.com' },
    update: {},
    create: {
      email: 'aluno.ana@escola.com',
      senha: senhaHash,
      nome: 'Ana Oliveira',
      role: 'ALUNO',
    },
  });

  const aluno3 = await prisma.usuario.upsert({
    where: { email: 'aluno.lucas@escola.com' },
    update: {},
    create: {
      email: 'aluno.lucas@escola.com',
      senha: senhaHash,
      nome: 'Lucas Souza',
      role: 'ALUNO',
    },
  });

  console.log('✅ Usuários criados');

  // ============================================
  // CRIAR PROFESSORES
  // ============================================

  const prof1 = await prisma.professor.upsert({
    where: { siape: '1234567' },
    update: {},
    create: {
      usuarioId: professor1.id,
      siape: '1234567',
      nomeCompleto: 'Maria Silva',
      especialidade: 'Matemática',
      formacao: 'Licenciatura em Matemática',
    },
  });

  const prof2 = await prisma.professor.upsert({
    where: { siape: '7654321' },
    update: {},
    create: {
      usuarioId: professor2.id,
      siape: '7654321',
      nomeCompleto: 'João Santos',
      especialidade: 'Português',
      formacao: 'Licenciatura em Letras',
    },
  });

  console.log('✅ Professores criados');

  // ============================================
  // CRIAR TURMAS
  // ============================================

  const turma1 = await prisma.turma.upsert({
    where: { nome_ano_periodo: { nome: '1 ano A', ano: 2024, periodo: 'MANHA' } },
    update: {},
    create: {
      nome: '1 ano A',
      ano: 2024,
      periodo: 'MANHA',
      capacidade: 40,
      professorId: prof1.id,
    },
  });

  const turma2 = await prisma.turma.upsert({
    where: { nome_ano_periodo: { nome: '2 ano B', ano: 2024, periodo: 'TARDE' } },
    update: {},
    create: {
      nome: '2 ano B',
      ano: 2024,
      periodo: 'TARDE',
      capacidade: 35,
      professorId: prof2.id,
    },
  });

  console.log('✅ Turmas criadas');

  // ============================================
  // CRIAR DISCIPLINAS
  // ============================================

  const disc1 = await prisma.disciplina.upsert({
    where: { nome_turmaId: { nome: 'Matemática', turmaId: turma1.id } },
    update: {},
    create: {
      nome: 'Matemática',
      turmaId: turma1.id,
      professorId: prof1.id,
      cargaHoraria: 60,
    },
  });

  const disc2 = await prisma.disciplina.upsert({
    where: { nome_turmaId: { nome: 'Português', turmaId: turma1.id } },
    update: {},
    create: {
      nome: 'Português',
      turmaId: turma1.id,
      professorId: prof2.id,
      cargaHoraria: 60,
    },
  });

  const disc3 = await prisma.disciplina.upsert({
    where: { nome_turmaId: { nome: 'Matemática', turmaId: turma2.id } },
    update: {},
    create: {
      nome: 'Matemática',
      turmaId: turma2.id,
      professorId: prof1.id,
      cargaHoraria: 60,
    },
  });

  console.log('✅ Disciplinas criadas');

  // ============================================
  // CRIAR ALUNOS
  // ============================================

  const al1 = await prisma.aluno.upsert({
    where: { matricula: '2024001' },
    update: {},
    create: {
      usuarioId: aluno1.id,
      matricula: '2024001',
      nomeCompleto: 'Pedro Costa',
      dataNascimento: new Date('2010-05-15'),
      turmaId: turma1.id,
      responsavelNome: 'Fernanda Costa',
      responsavelTel: '(11) 99999-1111',
      responsavelEmail: 'fernanda@email.com',
    },
  });

  const al2 = await prisma.aluno.upsert({
    where: { matricula: '2024002' },
    update: {},
    create: {
      usuarioId: aluno2.id,
      matricula: '2024002',
      nomeCompleto: 'Ana Oliveira',
      dataNascimento: new Date('2010-08-22'),
      turmaId: turma1.id,
      responsavelNome: 'Carlos Oliveira',
      responsavelTel: '(11) 99999-2222',
      responsavelEmail: 'carlos@email.com',
    },
  });

  const al3 = await prisma.aluno.upsert({
    where: { matricula: '2024003' },
    update: {},
    create: {
      usuarioId: aluno3.id,
      matricula: '2024003',
      nomeCompleto: 'Lucas Souza',
      dataNascimento: new Date('2009-12-10'),
      turmaId: turma2.id,
      responsavelNome: 'Mariana Souza',
      responsavelTel: '(11) 99999-3333',
      responsavelEmail: 'mariana@email.com',
    },
  });

  console.log('✅ Alunos criados');

  // ============================================
  // CRIAR NOTAS (exemplo)
  // ============================================

  const notas = [
    { alunoId: al1.id, disciplinaId: disc1.id, professorId: prof1.id, valor: 8.5, bimestre: 'PRIMEIRO', tipo: 'PROVA', descricao: 'Prova Bimestral' },
    { alunoId: al1.id, disciplinaId: disc1.id, professorId: prof1.id, valor: 7.0, bimestre: 'PRIMEIRO', tipo: 'TRABALHO', descricao: 'Trabalho em Grupo' },
    { alunoId: al1.id, disciplinaId: disc2.id, professorId: prof2.id, valor: 9.0, bimestre: 'PRIMEIRO', tipo: 'PROVA', descricao: 'Prova Bimestral' },
    { alunoId: al2.id, disciplinaId: disc1.id, professorId: prof1.id, valor: 6.5, bimestre: 'PRIMEIRO', tipo: 'PROVA', descricao: 'Prova Bimestral' },
    { alunoId: al2.id, disciplinaId: disc2.id, professorId: prof2.id, valor: 8.0, bimestre: 'PRIMEIRO', tipo: 'PROVA', descricao: 'Prova Bimestral' },
    { alunoId: al3.id, disciplinaId: disc3.id, professorId: prof1.id, valor: 7.5, bimestre: 'PRIMEIRO', tipo: 'PROVA', descricao: 'Prova Bimestral' },
  ];

  for (const nota of notas) {
    await prisma.nota.upsert({
      where: { alunoId_disciplinaId_bimestre_tipo: { alunoId: nota.alunoId, disciplinaId: nota.disciplinaId, bimestre: nota.bimestre, tipo: nota.tipo } },
      update: { valor: nota.valor },
      create: nota,
    });
  }

  console.log('✅ Notas criadas');

  // ============================================
  // CRIAR PRESENÇAS (exemplo)
  // ============================================

  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  const presencas = [
    { alunoId: al1.id, disciplinaId: disc1.id, professorId: prof1.id, data: hoje, status: 'PRESENTE' },
    { alunoId: al1.id, disciplinaId: disc2.id, professorId: prof2.id, data: hoje, status: 'PRESENTE' },
    { alunoId: al2.id, disciplinaId: disc1.id, professorId: prof1.id, data: hoje, status: 'AUSENTE' },
    { alunoId: al2.id, disciplinaId: disc2.id, professorId: prof2.id, data: hoje, status: 'PRESENTE' },
    { alunoId: al3.id, disciplinaId: disc3.id, professorId: prof1.id, data: hoje, status: 'JUSTIFICADO', observacao: 'Atestado médico' },
  ];

  for (const presenca of presencas) {
    await prisma.presenca.upsert({
      where: { alunoId_disciplinaId_data: { alunoId: presenca.alunoId, disciplinaId: presenca.disciplinaId, data: presenca.data } },
      update: { status: presenca.status },
      create: presenca,
    });
  }

  console.log('✅ Presenças criadas');

  console.log('\n🎉 Seed concluído!');
  console.log('\n📧 Credenciais de teste:');
  console.log('   Admin:    admin@escola.com / 123456');
  console.log('   Diretor:  diretor@escola.com / 123456');
  console.log('   Professor: prof.maria@escola.com / 123456');
  console.log('   Aluno:    aluno.pedro@escola.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
