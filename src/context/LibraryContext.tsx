import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Livro,
  Aluno,
  Emprestimo,
  Reserva,
  Avaliacao,
  Favorito,
  AppConfig,
  Sessao
} from '../types';
import {
  DEFAULT_CONFIG,
  generateSeedData,
  hoje,
  addDays,
  diasAtraso,
  uid
} from '../utils/helpers';

export interface ToastItem {
  id: string;
  msg: string;
  type: 'success' | 'error' | 'warn' | 'info';
}

export interface ModalConfig {
  title: string;
  content: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onSubmit?: () => void;
  onCancel?: () => void;
}

interface LibraryContextType {
  config: AppConfig;
  livros: Livro[];
  alunos: Aluno[];
  emprestimos: Emprestimo[];
  reservas: Reserva[];
  avaliacoes: Avaliacao[];
  favoritos: Favorito[];
  sessao: Sessao | null;
  currentView: string;
  isSidebarOpen: boolean;
  toasts: ToastItem[];
  currentModal: ModalConfig | null;

  // Actions
  loginAdmin: (password: string) => boolean;
  loginAluno: (matricula: string) => boolean;
  logout: () => void;
  toggleTheme: () => void;
  setCurrentView: (view: string) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warn' | 'info', duration?: number) => void;
  openModal: (modal: ModalConfig) => void;
  closeModal: () => void;
  confirmAction: (title: string, message: string, isDanger?: boolean) => Promise<boolean>;

  // Data Actions
  saveLivro: (dados: Omit<Livro, 'id'>, id?: string) => void;
  deleteLivro: (id: string) => Promise<boolean>;
  saveAluno: (dados: Omit<Aluno, 'id'>, id?: string) => boolean;
  deleteAluno: (id: string) => Promise<boolean>;
  novoEmprestimo: (livroId: string, alunoId: string, dataEmprestimo: string, dataPrevista: string) => boolean;
  devolverLivro: (id: string) => Promise<void>;
  renovarEmprestimo: (id: string) => Promise<void>;
  excluirEmprestimo: (id: string) => Promise<void>;
  solicitarReserva: (livroId: string) => void;
  aprovarReserva: (id: string) => void;
  rejeitarReserva: (id: string) => void;
  cancelarReserva: (id: string) => Promise<void>;
  toggleFavorito: (livroId: string) => void;
  avaliarLivro: (livroId: string, nota: number, comentario: string) => void;
  salvarConfig: (newConfig: Partial<AppConfig>) => void;
  exportarBackup: () => void;
  importarBackup: (jsonData: any) => boolean;
  resetarTudo: () => Promise<void>;

  // Domain Queries
  getLivro: (id: string) => Livro | undefined;
  getAluno: (id: string) => Aluno | undefined;
  ativosDoLivro: (livroId: string) => number;
  disponiveis: (livroId: string) => number;
  ativosDoAluno: (alunoId: string) => number;
  reservasPendentes: () => number;
  statusEmprestimo: (e: Emprestimo) => { txt: string; cls: 'ok' | 'danger' | 'warn' | 'info'; icon: string };
  mediaAvaliacoes: (livroId: string) => number;
  totalAvaliacoes: (livroId: string) => number;
  isFavorito: (alunoId: string, livroId: string) => boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_PREFIX = 'bib2_';

function loadStored<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function saveStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error('Erro ao salvar no localStorage', err);
  }
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State initialization
  const [config, setConfig] = useState<AppConfig>(() => ({
    ...DEFAULT_CONFIG,
    ...loadStored<Partial<AppConfig>>('config', {})
  }));

  const [livros, setLivros] = useState<Livro[]>(() => {
    const stored = loadStored<Livro[] | null>('livros', null);
    if (stored) return stored;
    return generateSeedData().livros;
  });

  const [alunos, setAlunos] = useState<Aluno[]>(() => {
    const stored = loadStored<Aluno[] | null>('alunos', null);
    if (stored) return stored;
    return generateSeedData().alunos;
  });

  const [emprestimos, setEmprestimos] = useState<Emprestimo[]>(() => {
    const stored = loadStored<Emprestimo[] | null>('emprestimos', null);
    if (stored) return stored;
    return generateSeedData().emprestimos;
  });

  const [reservas, setReservas] = useState<Reserva[]>(() =>
    loadStored<Reserva[]>('reservas', [])
  );

  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>(() =>
    loadStored<Avaliacao[]>('avaliacoes', [])
  );

  const [favoritos, setFavoritos] = useState<Favorito[]>(() =>
    loadStored<Favorito[]>('favoritos', [])
  );

  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [currentModal, setCurrentModal] = useState<ModalConfig | null>(null);

  // Sync with localStorage
  useEffect(() => {
    saveStored('config', config);
    document.documentElement.setAttribute('data-theme', config.tema);
    document.documentElement.style.setProperty('--accent', config.corAcento);
    document.documentElement.style.setProperty('--accent-2', config.corAcento2);
    document.title = `${config.emojiLogo} ${config.nomeEscola} · BiblioTrack`;
  }, [config]);

  useEffect(() => { saveStored('livros', livros); }, [livros]);
  useEffect(() => { saveStored('alunos', alunos); }, [alunos]);
  useEffect(() => { saveStored('emprestimos', emprestimos); }, [emprestimos]);
  useEffect(() => { saveStored('reservas', reservas); }, [reservas]);
  useEffect(() => { saveStored('avaliacoes', avaliacoes); }, [avaliacoes]);
  useEffect(() => { saveStored('favoritos', favoritos); }, [favoritos]);

  // Toast
  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'warn' | 'info' = 'info', duration = 3200) => {
    const id = uid();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Modal & Confirm
  const openModal = useCallback((modal: ModalConfig) => {
    setCurrentModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    if (currentModal?.onCancel) {
      currentModal.onCancel();
    }
    setCurrentModal(null);
  }, [currentModal]);

  const confirmAction = useCallback((title: string, message: string, isDanger = true): Promise<boolean> => {
    return new Promise((resolve) => {
      setCurrentModal({
        title,
        content: <p style={{ color: 'var(--text-2)', fontSize: '.92rem', lineHeight: 1.6 }}>{message}</p>,
        submitLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        isDanger,
        onSubmit: () => {
          setCurrentModal(null);
          resolve(true);
        },
        onCancel: () => {
          setCurrentModal(null);
          resolve(false);
        }
      });
    });
  }, []);

  // Auth
  const loginAdmin = useCallback((password: string): boolean => {
    if (password !== 'admin123') {
      showToast('Senha incorreta', 'error');
      return false;
    }
    setSessao({ role: 'admin', nome: 'Bibliotecário' });
    setCurrentView('dashboard');
    showToast('Bem-vindo, Bibliotecário!', 'success');
    return true;
  }, [showToast]);

  const loginAluno = useCallback((matricula: string): boolean => {
    const trimmed = matricula.trim();
    const aluno = alunos.find(a => a.matricula === trimmed);
    if (!aluno) {
      showToast('Matrícula não encontrada', 'error');
      return false;
    }
    setSessao({ role: 'aluno', alunoId: aluno.id, nome: aluno.nome });
    setCurrentView('inicio');
    showToast(`Bem-vindo, ${aluno.nome.split(' ')[0]}!`, 'success');
    return true;
  }, [alunos, showToast]);

  const logout = useCallback(() => {
    setSessao(null);
    setCurrentView('login');
    showToast('Sessão encerrada', 'info');
  }, [showToast]);

  const toggleTheme = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      tema: prev.tema === 'dark' ? 'light' : 'dark'
    }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  // Queries
  const getLivro = useCallback((id: string) => livros.find(l => l.id === id), [livros]);
  const getAluno = useCallback((id: string) => alunos.find(a => a.id === id), [alunos]);

  const ativosDoLivro = useCallback((livroId: string) => {
    return emprestimos.filter(e => e.livroId === livroId && !e.dataDevolucao).length;
  }, [emprestimos]);

  const disponiveis = useCallback((livroId: string) => {
    const l = livros.find(x => x.id === livroId);
    if (!l) return 0;
    return Math.max(0, l.quantidade - ativosDoLivro(livroId));
  }, [livros, ativosDoLivro]);

  const ativosDoAluno = useCallback((alunoId: string) => {
    return emprestimos.filter(e => e.alunoId === alunoId && !e.dataDevolucao).length;
  }, [emprestimos]);

  const reservasPendentes = useCallback(() => {
    return reservas.filter(r => r.status === 'pendente').length;
  }, [reservas]);

  const statusEmprestimo = useCallback((e: Emprestimo) => {
    if (e.dataDevolucao) return { txt: 'Devolvido', cls: 'ok' as const, icon: '✓' };
    if (e.dataPrevista < hoje()) return { txt: `Atrasado ${diasAtraso(e.dataPrevista)}d`, cls: 'danger' as const, icon: '⚠' };
    const diff = Math.floor((new Date(e.dataPrevista).getTime() - new Date(hoje()).getTime()) / 86400000);
    if (diff <= 3) return { txt: `Vence em ${diff}d`, cls: 'warn' as const, icon: '⏰' };
    return { txt: 'Em andamento', cls: 'info' as const, icon: '📖' };
  }, []);

  const mediaAvaliacoes = useCallback((livroId: string) => {
    const avs = avaliacoes.filter(a => a.livroId === livroId);
    if (!avs.length) return 0;
    return Number((avs.reduce((s, a) => s + a.nota, 0) / avs.length).toFixed(1));
  }, [avaliacoes]);

  const totalAvaliacoes = useCallback((livroId: string) => {
    return avaliacoes.filter(a => a.livroId === livroId).length;
  }, [avaliacoes]);

  const isFavorito = useCallback((alunoId: string, livroId: string) => {
    return favoritos.some(f => f.alunoId === alunoId && f.livroId === livroId);
  }, [favoritos]);

  // Data Actions
  const saveLivro = useCallback((dados: Omit<Livro, 'id'>, id?: string) => {
    if (id) {
      setLivros(prev => prev.map(l => l.id === id ? { ...l, ...dados } : l));
      showToast('Livro atualizado', 'success');
    } else {
      const novoLivro: Livro = { id: uid(), ...dados };
      setLivros(prev => [...prev, novoLivro]);
      showToast('Livro cadastrado', 'success');
    }
  }, [showToast]);

  const deleteLivro = useCallback(async (id: string): Promise<boolean> => {
    if (emprestimos.some(e => e.livroId === id && !e.dataDevolucao)) {
      showToast('Há exemplares emprestados deste livro', 'error');
      return false;
    }
    const confirmed = await confirmAction('Excluir livro', 'Tem certeza? O histórico de empréstimos será mantido.');
    if (!confirmed) return false;

    setLivros(prev => prev.filter(l => l.id !== id));
    showToast('Livro removido', 'success');
    return true;
  }, [emprestimos, confirmAction, showToast]);

  const saveAluno = useCallback((dados: Omit<Aluno, 'id'>, id?: string): boolean => {
    const mat = dados.matricula.trim();
    const dup = alunos.some(a => a.matricula === mat && a.id !== id);
    if (dup) {
      showToast('Matrícula já cadastrada', 'error');
      return false;
    }
    if (id) {
      setAlunos(prev => prev.map(a => a.id === id ? { ...a, ...dados, matricula: mat } : a));
      showToast('Aluno atualizado', 'success');
    } else {
      const novoAluno: Aluno = { id: uid(), ...dados, matricula: mat };
      setAlunos(prev => [...prev, novoAluno]);
      showToast('Aluno cadastrado', 'success');
    }
    return true;
  }, [alunos, showToast]);

  const deleteAluno = useCallback(async (id: string): Promise<boolean> => {
    if (emprestimos.some(e => e.alunoId === id && !e.dataDevolucao)) {
      showToast('Aluno tem empréstimos ativos', 'error');
      return false;
    }
    const confirmed = await confirmAction('Excluir aluno', 'Tem certeza? O histórico será mantido.');
    if (!confirmed) return false;

    setAlunos(prev => prev.filter(a => a.id !== id));
    showToast('Aluno removido', 'success');
    return true;
  }, [emprestimos, confirmAction, showToast]);

  const novoEmprestimo = useCallback((livroId: string, alunoId: string, dataEmprestimo: string, dataPrevista: string): boolean => {
    if (ativosDoAluno(alunoId) >= config.maxEmprestimos) {
      showToast(`Aluno atingiu o limite de ${config.maxEmprestimos} empréstimos`, 'error');
      return false;
    }
    if (disponiveis(livroId) <= 0) {
      showToast('Nenhum exemplar disponível para este livro', 'error');
      return false;
    }
    const novo: Emprestimo = {
      id: uid(),
      livroId,
      alunoId,
      dataEmprestimo,
      dataPrevista,
      dataDevolucao: null,
      renovacoes: 0
    };
    setEmprestimos(prev => [...prev, novo]);
    showToast('Empréstimo registrado com sucesso', 'success');
    return true;
  }, [ativosDoAluno, disponiveis, config.maxEmprestimos, showToast]);

  const devolverLivro = useCallback(async (id: string) => {
    const e = emprestimos.find(x => x.id === id);
    if (!e) return;
    const confirmed = await confirmAction('Devolver livro', 'Confirmar a devolução deste livro?');
    if (!confirmed) return;

    setEmprestimos(prev => prev.map(item => item.id === id ? { ...item, dataDevolucao: hoje() } : item));
    showToast('Livro devolvido com sucesso', 'success');
    setTimeout(() => {
      showToast('Você pode avaliar o livro na área do aluno', 'info');
    }, 800);
  }, [emprestimos, confirmAction, showToast]);

  const renovarEmprestimo = useCallback(async (id: string) => {
    const e = emprestimos.find(x => x.id === id);
    if (!e) return;
    if (e.dataDevolucao) {
      showToast('Empréstimo já devolvido', 'error');
      return;
    }
    if ((e.renovacoes || 0) >= 1) {
      showToast('Este empréstimo já foi renovado', 'warn');
      return;
    }
    if (e.dataPrevista < hoje()) {
      showToast('Empréstimo em atraso, não pode renovar', 'error');
      return;
    }
    const novoPrazo = addDays(e.dataPrevista, config.prazoPadrao);
    const confirmed = await confirmAction('Renovar empréstimo', `Novo prazo será ${novoPrazo}. Confirmar?`, false);
    if (!confirmed) return;

    setEmprestimos(prev => prev.map(item =>
      item.id === id ? { ...item, dataPrevista: novoPrazo, renovacoes: (item.renovacoes || 0) + 1 } : item
    ));
    showToast('Empréstimo renovado com sucesso', 'success');
  }, [emprestimos, config.prazoPadrao, confirmAction, showToast]);

  const excluirEmprestimo = useCallback(async (id: string) => {
    const confirmed = await confirmAction('Excluir empréstimo', 'O registro será apagado permanentemente.');
    if (!confirmed) return;
    setEmprestimos(prev => prev.filter(e => e.id !== id));
    showToast('Empréstimo excluído', 'success');
  }, [confirmAction, showToast]);

  const solicitarReserva = useCallback((livroId: string) => {
    if (!sessao?.alunoId) return;
    const alunoId = sessao.alunoId;

    if (ativosDoAluno(alunoId) >= config.maxEmprestimos) {
      showToast(`Limite de ${config.maxEmprestimos} empréstimos atingido`, 'error');
      return;
    }
    const jaTem = reservas.find(r => r.livroId === livroId && r.alunoId === alunoId && r.status === 'pendente');
    if (jaTem) {
      showToast('Você já reservou este livro', 'warn');
      return;
    }
    const novaReserva: Reserva = {
      id: uid(),
      livroId,
      alunoId,
      data: hoje(),
      status: 'pendente'
    };
    setReservas(prev => [...prev, novaReserva]);
    showToast('Reserva solicitada! Aguarde aprovação 📅', 'success');
  }, [sessao, ativosDoAluno, config.maxEmprestimos, reservas, showToast]);

  const aprovarReserva = useCallback((id: string) => {
    const r = reservas.find(x => x.id === id);
    if (!r) return;
    if (disponiveis(r.livroId) === 0) {
      showToast('Sem exemplares disponíveis no momento', 'error');
      return;
    }
    if (ativosDoAluno(r.alunoId) >= config.maxEmprestimos) {
      showToast('Aluno atingiu o limite de empréstimos', 'error');
      return;
    }
    const novoEmp: Emprestimo = {
      id: uid(),
      livroId: r.livroId,
      alunoId: r.alunoId,
      dataEmprestimo: hoje(),
      dataPrevista: addDays(hoje(), config.prazoPadrao),
      dataDevolucao: null,
      renovacoes: 0
    };
    setEmprestimos(prev => [...prev, novoEmp]);
    setReservas(prev => prev.map(res => res.id === id ? { ...res, status: 'aprovada' } : res));
    showToast('Reserva aprovada e empréstimo criado', 'success');
  }, [reservas, disponiveis, ativosDoAluno, config.maxEmprestimos, config.prazoPadrao, showToast]);

  const rejeitarReserva = useCallback((id: string) => {
    setReservas(prev => prev.map(res => res.id === id ? { ...res, status: 'rejeitada' } : res));
    showToast('Reserva rejeitada', 'info');
  }, [showToast]);

  const cancelarReserva = useCallback(async (id: string) => {
    const confirmed = await confirmAction('Cancelar reserva', 'Deseja cancelar esta reserva?');
    if (!confirmed) return;
    setReservas(prev => prev.map(res => res.id === id ? { ...res, status: 'cancelada' } : res));
    showToast('Reserva cancelada', 'info');
  }, [confirmAction, showToast]);

  const toggleFavorito = useCallback((livroId: string) => {
    if (!sessao?.alunoId) return;
    const alunoId = sessao.alunoId;
    const exists = favoritos.some(f => f.alunoId === alunoId && f.livroId === livroId);
    if (exists) {
      setFavoritos(prev => prev.filter(f => !(f.alunoId === alunoId && f.livroId === livroId)));
      showToast('Removido dos favoritos', 'info');
    } else {
      setFavoritos(prev => [...prev, { alunoId, livroId }]);
      showToast('Adicionado aos favoritos ❤️', 'success');
    }
  }, [sessao, favoritos, showToast]);

  const avaliarLivro = useCallback((livroId: string, nota: number, comentario: string) => {
    if (!sessao?.alunoId) return;
    const alunoId = sessao.alunoId;
    setAvaliacoes(prev => {
      const filtered = prev.filter(a => !(a.livroId === livroId && a.alunoId === alunoId));
      return [
        ...filtered,
        {
          id: uid(),
          livroId,
          alunoId,
          nota,
          comentario: comentario.trim(),
          data: hoje()
        }
      ];
    });
    showToast('Obrigado pela avaliação!', 'success');
  }, [sessao, showToast]);

  const salvarConfig = useCallback((newConfig: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
    showToast('Configurações salvas', 'success');
  }, [showToast]);

  const exportarBackup = useCallback(() => {
    const dados = {
      config,
      livros,
      alunos,
      emprestimos,
      reservas,
      avaliacoes,
      favoritos,
      versao: 2
    };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `bibliotrack-backup-${hoje()}.json`;
    a.click();
    showToast('Backup exportado', 'success');
  }, [config, livros, alunos, emprestimos, reservas, avaliacoes, favoritos, showToast]);

  const importarBackup = useCallback((jsonData: any): boolean => {
    try {
      if (!jsonData || !jsonData.livros || !jsonData.alunos) {
        throw new Error('Arquivo de backup inválido');
      }
      if (jsonData.config) setConfig(prev => ({ ...DEFAULT_CONFIG, ...jsonData.config }));
      setLivros(jsonData.livros);
      setAlunos(jsonData.alunos);
      setEmprestimos(jsonData.emprestimos || []);
      setReservas(jsonData.reservas || []);
      setAvaliacoes(jsonData.avaliacoes || []);
      setFavoritos(jsonData.favoritos || []);
      showToast('Backup importado com sucesso', 'success');
      return true;
    } catch (err) {
      showToast('Arquivo inválido para restauração', 'error');
      return false;
    }
  }, [showToast]);

  const resetarTudo = useCallback(async () => {
    const conf1 = await confirmAction('Zerar dados', 'TODOS os dados (livros, alunos, empréstimos) serão apagados. Tem certeza absoluta?');
    if (!conf1) return;
    const conf2 = await confirmAction('Confirmar de novo', 'Isso não pode ser desfeito. Continuar?');
    if (!conf2) return;

    localStorage.clear();
    const seed = generateSeedData();
    setConfig(DEFAULT_CONFIG);
    setLivros(seed.livros);
    setAlunos(seed.alunos);
    setEmprestimos(seed.emprestimos);
    setReservas([]);
    setAvaliacoes([]);
    setFavoritos([]);
    setSessao(null);
    setCurrentView('login');
    showToast('Dados restaurados para o padrão', 'info');
  }, [confirmAction, showToast]);

  const value = useMemo(() => ({
    config,
    livros,
    alunos,
    emprestimos,
    reservas,
    avaliacoes,
    favoritos,
    sessao,
    currentView,
    isSidebarOpen,
    toasts,
    currentModal,
    loginAdmin,
    loginAluno,
    logout,
    toggleTheme,
    setCurrentView,
    toggleSidebar,
    closeSidebar,
    showToast,
    openModal,
    closeModal,
    confirmAction,
    saveLivro,
    deleteLivro,
    saveAluno,
    deleteAluno,
    novoEmprestimo,
    devolverLivro,
    renovarEmprestimo,
    excluirEmprestimo,
    solicitarReserva,
    aprovarReserva,
    rejeitarReserva,
    cancelarReserva,
    toggleFavorito,
    avaliarLivro,
    salvarConfig,
    exportarBackup,
    importarBackup,
    resetarTudo,
    getLivro,
    getAluno,
    ativosDoLivro,
    disponiveis,
    ativosDoAluno,
    reservasPendentes,
    statusEmprestimo,
    mediaAvaliacoes,
    totalAvaliacoes,
    isFavorito
  }), [
    config, livros, alunos, emprestimos, reservas, avaliacoes, favoritos, sessao,
    currentView, isSidebarOpen, toasts, currentModal,
    loginAdmin, loginAluno, logout, toggleTheme, toggleSidebar, closeSidebar, showToast,
    openModal, closeModal, confirmAction, saveLivro, deleteLivro, saveAluno, deleteAluno,
    novoEmprestimo, devolverLivro, renovarEmprestimo, excluirEmprestimo, solicitarReserva,
    aprovarReserva, rejeitarReserva, cancelarReserva, toggleFavorito, avaliarLivro,
    salvarConfig, exportarBackup, importarBackup, resetarTudo,
    getLivro, getAluno, ativosDoLivro, disponiveis, ativosDoAluno, reservasPendentes,
    statusEmprestimo, mediaAvaliacoes, totalAvaliacoes, isFavorito
  ]);

  return (
    <LibraryContext.Provider value={value}>
      {children}
    </LibraryContext.Provider>
  );
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary deve ser usado dentro de um LibraryProvider');
  }
  return context;
}
