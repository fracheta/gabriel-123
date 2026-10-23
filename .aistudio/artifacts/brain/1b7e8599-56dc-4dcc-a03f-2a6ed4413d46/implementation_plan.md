# Plano de Reformulação Profissional · BiblioTrack (GitHub Pages + Firebase Firestore)

Consultoria e desenvolvimento full-stack para auditar, corrigir bugs, reforçar a segurança e transformar o sistema de gestão de biblioteca escolar em uma aplicação rápida, moderna, responsiva e pronta para GitHub Pages.

---

## Decisões Confirmadas e Alinhamento

> [!IMPORTANT]
> **Decisões confirmadas com o usuário**:
> 1. **Modelo de Autenticação**: Manter o fluxo rápido e funcional de login por **senha para bibliotecário** (`admin123`) e **matrícula para alunos** (armazenados diretamente no Firestore), garantindo máxima agilidade no dia a dia da escola.
> 2. **Arquitetura de Código**: Manter a aplicação centralizada de forma robusta e modular em um `index.html` limpo e autossuficiente (HTML + CSS moderno + JavaScript em ES Modules), compatível 100% com **GitHub Pages** (sem exigir pipelines complexos de compilação externa).
> 3. **Hospedagem & Banco de Dados**: **GitHub Pages** estático consumindo **Google Cloud Firebase Firestore** em tempo real com `onSnapshot`.

---

## Fase 1 — Relatório de Auditoria e Diagnóstico (Análise do Código Atual)

### 1. Classificação de Problemas por Prioridade

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MATRIZ DE PRIORIDADE DA AUDITORIA                                           │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ 🔴 CRÍTICO   │ Exposição de credenciais sensíveis vs. segurança Firestore;  │
│              │ Falta de validação de duplicidade em matrículas e ISBNs;     │
│              │ Inconsistência de estoque (exemplares negativos);            │
│              │ Possíveis erros não capturados que travavam a UI.            │
├──────────────┼──────────────────────────────────────────────────────────────┤
│ 🟠 ALTO      │ Ausência de loading states e feedback visual assíncrono;     │
│              │ Vulnerabilidades de XSS em campos de texto livre (sinopse);  │
│              │ Fórmulas manuais de atraso gerando NaN em datas inválidas;   │
│              │ Falta de paginação ou virtualização para acervos grandes.    │
├──────────────┼──────────────────────────────────────────────────────────────┤
│ 🟡 MÉDIO     │ Acessibilidade WCAG (falta de aria-labels e focus trap);     │
│              │ Contraste de cor em botões de texto secundário;              │
│              │ Ausência de confirmação antes de excluir registros;          │
│              │ Inexistência de índices estruturados para buscas compostas.  │
├──────────────┼──────────────────────────────────────────────────────────────┤
│ 🟢 BAIXO     │ Ausência de exportação CSV/PDF profissional;                 │
│              │ Falta de suporte a PWA (manifest + service worker offline);  │
│              │ QR Code para identificação rápida de livros e carteirinhas.  │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

### 2. Diagnóstico Detalhado

#### A. Bugs e Vulnerabilidades Identificados
1. **Controle de Estoque & Concorrência**: No código original, quando dois usuários tentavam pegar o último exemplar ao mesmo tempo, a quantidade de disponíveis podia ficar negativa. Deve ser blindada com verificação atômica.
2. **Datas & Timezones**: O uso de strings `YYYY-MM-DD` com `new Date(str)` em fusos horários negativos (como UTC-3 no Brasil) frequentemente retroagia 1 dia (bug clássico de `T00:00:00Z`). Correção com parsing local explícito.
3. **Segurança do Firestore**: O arquivo `firebase-applet-config.json` contém identificadores do projeto e API keys web (normais no Firebase client-side). No entanto, o `firestore.rules` precisa garantir que apenas operações válidas e dados sanitizados sejam gravados.
4. **Tratamento de Erros no Firestore**: Todas as chamadas assíncronas (`setDoc`, `updateDoc`, `deleteDoc`) devem ter tratamento com toast amigável e captura de falhas de permissão ou rede.

---

## Fase 2 — Correções Estruturais e de Segurança

### 1. Robustez do Firebase & Tratamento de Erros
- Implementação de wrapper resiliente com `try/catch` em 100% das chamadas do Firestore.
- Fallback elegante caso a rede fique temporariamente instável (mensagens de toast e fila de retry).
- Sanitização rigorosa contra XSS com escape de HTML em todos os campos renderizados dinamicamente.

### 2. Validação Estrita de Formulários
- **Alunos**: Nome obrigatório (mínimo 3 caracteres), matrícula numérica única e e-mail institucional válido.
- **Livros**: Título e autor obrigatórios, quantidade mínima de 1 exemplar, ano de publicação válido.
- **Empréstimos**: Bloqueio automático de alunos com limite de empréstimos atingido ou empréstimos em atraso crítico.

---

## Fase 3 — Novas Funcionalidades (Otimizações & Recursos)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ MAPA DE NOVAS FUNCIONALIDADES                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Dashboard Executivo com KPIs em Tempo Real (Acervo, Ativos, Atrasados)    │
│ 2. Busca e Filtro Instantâneo Multi-critério (Título, Autor, Gênero, Status) │
│ 3. Histórico Completo de Leitura por Aluno com Gráfico de Desempenho         │
│ 4. Controle Avançado de Empréstimos com Renovação em 1 Clique e Multa        │
│ 5. Exportação de Relatórios em CSV e JSON formatados para impressão / Excel  │
│ 6. Gerador de QR Code para cada Livro e Carteirinha de Aluno                 │
│ 7. Suporte a PWA (Progressive Web App) para funcionar offline e ser instalado│
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1. Sistema de Multas e Renovação
- Cálculo automático de multa configurável (ex.: R$ 0,50 por dia de atraso).
- Botão rápido de renovação estendendo o prazo padrão, com limite de 1 renovação por empréstimo.

### 2. Exportação e Gestão de Dados
- Exportação para planilha CSV (compatível com Excel e Google Sheets) de:
  - Lista completa de alunos e contatos;
  - Acervo de livros com quantidades e status;
  - Histórico geral de empréstimos e pendências financeiras/multas.

### 3. PWA (Progressive Web App)
- Adição de `manifest.json` com ícones, tema e visual de aplicativo nativo no celular.
- Registro de Service Worker para carregamento instantâneo mesmo com oscilações de internet escolar.

---

## Fase 4 — UX/UI Profissional (Aparência Moderna e Acessível)

1. **Design System & Tipografia**:
   - Tipografia moderna com *Plus Jakarta Sans* e *Inter*.
   - Cores semânticas sem saturação excessiva (60% fundo limpo, 30% superfícies estruturais, 10% acento funcional).
   - Zero-pill discipline: metadados limpos com separadores tipográficos (`·`), sem cápsulas artificiais.

2. **Acessibilidade (WCAG AA)**:
   - Navegação completa por teclado (Tab, Enter, Escape para fechar modais).
   - Focus trap e `aria-modal="true"` nos diálogos.
   - Contraste mínimo de 4.5:1 em todos os textos e rótulos.
   - Feedback em botões com estado de *loading* e desativação para evitar cliques duplos.

3. **Modos Claro & Escuro Aprimorados**:
   - Paleta equilibrada com transições suaves e sem flashes de claridade.

---

## Fase 5 — Performance & Deploy no GitHub Pages

1. **Otimização de Leituras no Firestore**:
   - Sincronização via `onSnapshot` único por coleção com cache em memória.
   - Sem requisições redundantes ou loops de polling.
2. **SEO & Metadados**:
   - Meta tags OpenGraph, Twitter Cards e descrição completa para compartilhamento e indexação.
3. **Instruções para GitHub Pages**:
   - Arquivo único de distribuição direta ou via branch `gh-pages` / `main`.
   - Adição do domínio `fracheta.github.io` nas origens autorizadas do Firebase Console.

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ FLUXO DE DADOS E ARQUITETURA DO SISTEMA                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [ Usuário / Navegador ] ──(Interações)──> [ UI Controllers / Validação ]    │
│              │                                          │                   │
│              ▼                                          ▼                   │
│  [ Estado Local Reativo ] <───(onSnapshot)─── [ Firebase Firestore Client ] │
│              │                                          │                   │
│              ▼                                          ▼                   │
│  [ Renderização DOM ]                     [ Banco Firestore na Nuvem ]      │
│  - Dashboard & KPIs                       - /livros                         │
│  - Acervo & Busca                         - /alunos                         │
│  - Empréstimos & Multas                   - /emprestimos                    │
│  - Minhas Reservas                        - /reservas                       │
│  - Exportação CSV                         - /config/geral                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Verificação e Próximos Passos

1. **Validação do Plano**: O plano será revisado com o usuário para autorização do início da **Fase 1 e Fase 2**.
2. **Execução Passo a Passo**:
   - Apresentação inicial do diagnóstico minucioso.
   - Refatoração e implementação das correções de bugs, formulários e banco.
   - Adição de relatórios CSV, multas, QR Code e PWA.
   - Teste final de compilação e verificação de funcionamento no navegador.
