import { AppConfig, Livro, Aluno, Emprestimo } from '../types';

export const ADMIN_SENHA = 'admin123';

export const uid = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const hoje = (): string => new Date().toISOString().slice(0, 10);

export function addDays(str: string, days: number): string {
  const d = new Date(str + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const [a, m, d] = parts;
  return `${d}/${m}/${a}`;
}

export function fmtDateCurta(iso: string | null | undefined): string {
  if (!iso) return '—';
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  const [, m, d] = parts;
  return `${d}/${m}`;
}

export function diasAtraso(iso: string): number {
  const diff = new Date(hoje()).getTime() - new Date(iso + 'T00:00:00').getTime();
  return Math.floor(diff / 86400000);
}

export function corDoTexto(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = str.charCodeAt(i) + ((h << 5) - h);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

export function iniciais(nome: string): string {
  const p = (nome || '').trim().split(/\s+/);
  return (((p[0]?.[0] || '') + (p[p.length - 1]?.[0] || '')).toUpperCase()) || '?';
}

export const DEFAULT_CONFIG: AppConfig = {
  nomeEscola: 'Biblioteca Escolar',
  emojiLogo: '📚',
  corAcento: '#6366f1',
  corAcento2: '#8b5cf6',
  prazoPadrao: 14,
  maxEmprestimos: 3,
  tema: 'light'
};

export const EMOJIS_CAPA = [
  '📕','📗','📘','📙','📓','📔','📒','🌹','⚡','💍',
  '👁️','🐷','🧠','🌻','🗡️','🚀','🧙','👑','🌟','🎭',
  '🎨','🔮','🌍','🧪','💡','🏰','🐉','🎯','🌙','☀️','🍀','🌸'
];

export const CORES_PALETA: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#3b82f6', '#06b6d4'],
  ['#10b981', '#22d3ee'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#f43f5e'],
  ['#8b5cf6', '#ec4899'],
  ['#0ea5e9', '#6366f1'],
  ['#14b8a6', '#10b981'],
  ['#f97316', '#f59e0b']
];

export const BOOK_CARD_COLORS = ['#fee2e2','#fef3c7','#dcfce7','#dbeafe','#ede9fe','#fce7f3'];

export function getBookCardBg(title: string): string {
  const code = (title.charCodeAt(0) || 0) + title.length;
  return BOOK_CARD_COLORS[code % BOOK_CARD_COLORS.length];
}

export function generateSeedData(): { livros: Livro[]; alunos: Aluno[]; emprestimos: Emprestimo[] } {
  const dadosLivros: [string, string, string, number, number, string][] = [
    ['Dom Casmurro', 'Machado de Assis', 'Romance', 1899, 3, '📕'],
    ['O Cortiço', 'Aluísio Azevedo', 'Romance', 1890, 2, '📗'],
    ['Vidas Secas', 'Graciliano Ramos', 'Romance', 1938, 4, '📘'],
    ['Grande Sertão: Veredas', 'Guimarães Rosa', 'Romance', 1956, 2, '📙'],
    ['Capitães da Areia', 'Jorge Amado', 'Romance', 1937, 3, '📓'],
    ['A Hora da Estrela', 'Clarice Lispector', 'Romance', 1977, 1, '📔'],
    ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', 'Infantil', 1943, 5, '🌹'],
    ['Harry Potter e a Pedra Filosofal', 'J.K. Rowling', 'Fantasia', 1997, 3, '⚡'],
    ['O Senhor dos Anéis', 'J.R.R. Tolkien', 'Fantasia', 1954, 2, '💍'],
    ['1984', 'George Orwell', 'Distopia', 1949, 3, '👁️'],
    ['A Revolução dos Bichos', 'George Orwell', 'Distopia', 1945, 2, '🐷'],
    ['Sapiens', 'Yuval Noah Harari', 'História', 2011, 2, '🧠'],
    ['Cem Anos de Solidão', 'Gabriel García Márquez', 'Romance', 1967, 1, '🌻'],
    ['O Hobbit', 'J.R.R. Tolkien', 'Fantasia', 1937, 2, '🗡️']
  ];

  const livros: Livro[] = dadosLivros.map(([t, a, c, an, q, e]) => ({
    id: uid(),
    titulo: t,
    autor: a,
    categoria: c,
    ano: an,
    quantidade: q,
    capa: e,
    isbn: '',
    sinopse: ''
  }));

  const alunos: Aluno[] = [
    { id: uid(), nome: 'Ana Souza',   matricula: '2024001', turma: '1º Ano A', email: 'ana@escola.com' },
    { id: uid(), nome: 'Bruno Lima',  matricula: '2024002', turma: '2º Ano B', email: 'bruno@escola.com' },
    { id: uid(), nome: 'Carla Dias',  matricula: '2024003', turma: '3º Ano A', email: 'carla@escola.com' },
    { id: uid(), nome: 'Diego Alves', matricula: '2024004', turma: '2º Ano A', email: 'diego@escola.com' },
    { id: uid(), nome: 'Elisa Ramos', matricula: '2024005', turma: '1º Ano B', email: 'elisa@escola.com' }
  ];

  const agora = hoje();
  const emprestimos: Emprestimo[] = [
    {
      id: uid(),
      livroId: livros[0].id,
      alunoId: alunos[0].id,
      dataEmprestimo: addDays(agora, -5),
      dataPrevista: addDays(agora, 9),
      dataDevolucao: null,
      renovacoes: 0
    },
    {
      id: uid(),
      livroId: livros[7].id,
      alunoId: alunos[1].id,
      dataEmprestimo: addDays(agora, -20),
      dataPrevista: addDays(agora, -6),
      dataDevolucao: null,
      renovacoes: 0
    },
    {
      id: uid(),
      livroId: livros[2].id,
      alunoId: alunos[2].id,
      dataEmprestimo: addDays(agora, -25),
      dataPrevista: addDays(agora, -11),
      dataDevolucao: addDays(agora, -8),
      renovacoes: 0
    }
  ];

  return { livros, alunos, emprestimos };
}
