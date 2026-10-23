export interface Livro {
  id: string;
  titulo: string;
  autor: string;
  categoria: string;
  ano: number | null;
  quantidade: number;
  capa: string;
  isbn: string;
  sinopse: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  email: string;
}

export interface Emprestimo {
  id: string;
  livroId: string;
  alunoId: string;
  dataEmprestimo: string; // ISO date YYYY-MM-DD
  dataPrevista: string;   // ISO date YYYY-MM-DD
  dataDevolucao: string | null;
  renovacoes: number;
}

export interface Reserva {
  id: string;
  livroId: string;
  alunoId: string;
  data: string;
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada';
}

export interface Avaliacao {
  id: string;
  livroId: string;
  alunoId: string;
  nota: number;
  comentario: string;
  data: string;
}

export interface Favorito {
  alunoId: string;
  livroId: string;
}

export interface AppConfig {
  nomeEscola: string;
  emojiLogo: string;
  corAcento: string;
  corAcento2: string;
  prazoPadrao: number;
  maxEmprestimos: number;
  tema: 'light' | 'dark';
}

export type UserRole = 'admin' | 'aluno';

export interface Sessao {
  role: UserRole;
  nome: string;
  alunoId?: string;
}
