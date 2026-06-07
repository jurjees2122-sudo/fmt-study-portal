// FMT Study Portal — app.js
// Forensic Medicine & Toxicology HAQ Question Bank

(function () {
  'use strict';

  const DB = typeof FMT_QUESTIONS !== 'undefined' ? FMT_QUESTIONS : [];
  let filteredQuestions = [...DB];
  let activeChapter = 'ALL';
  let activeType = 'ALL';
  let searchTerm = '';
  let currentModalIndex = 0;

  // ── DOM refs ──
  const grid = document.getElementById('questionGrid');
  const noResults = document.getElementById('noResults');
  const chapterNav = document.getElementById('chapterNav');
  const searchInput = document.getElementById('searchInput');
  const resultsBar = document.getElementById('resultsBar');
  const resultsCount = document.getElementById('resultsCount');
  const clearFilter = document.getElementById('clearFilter');
  const currentChapterLabel = document.getElementById('currentChapterLabel');
  const totalCount = document.getElementById('totalCount');
  const laqCount = document.getElementById('laqCount');
  const saqCount = document.getElementById('saqCount');
  const vsaqCount = document.getElementById('vsaqCount');

  // Modal
  const modalOverlay = document.getElementById('modalOverlay');
  const modalType = document.getElementById('modalType');
  const modalChapter = document.getElementById('modalChapter');
  const modalStars = document.getElementById('modalStars');
  const modalQuestion = document.getElementById('modalQuestion');
  const modalAnswer = document.getElementById('modalAnswer');
  const modalClose = document.getElementById('modalClose');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const modalQnum = document.getElementById('modalQnum');

  // Sidebar
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const menuBtn = document.getElementById('menuBtn');
  const sidebarClose = document.getElementById('sidebarClose');

  // ── Init ──
  function init() {
    updateStats();
    buildChapterNav();
    applyFilters();
    bindEvents();
  }

  // ── Stats ──
  function updateStats() {
    totalCount.textContent = DB.length;
    laqCount.textContent = DB.filter(q => q.type === 'LAQ').length;
    saqCount.textContent = DB.filter(q => q.type === 'SAQ').length;
    vsaqCount.textContent = DB.filter(q => q.type === 'VSAQ').length;
  }

  // ── Chapter Nav ──
  function buildChapterNav() {
    const chapters = {};
    DB.forEach(q => {
      if (!chapters[q.chapter]) chapters[q.chapter] = 0;
      chapters[q.chapter]++;
    });

    // All button
    const allBtn = makeChapterBtn('ALL', 'All Chapters', DB.length, true);
    chapterNav.appendChild(allBtn);

    Object.entries(chapters).sort().forEach(([ch, cnt]) => {
      const btn = makeChapterBtn(ch, ch, cnt, false);
      chapterNav.appendChild(btn);
    });
  }

  function makeChapterBtn(key, label, count, isActive) {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn' + (isActive ? ' active' : '');
    btn.dataset.chapter = key;
    btn.innerHTML = `<span>${label}</span><span class="ch-count">${count}</span>`;
    btn.addEventListener('click', () => {
      activeChapter = key;
      document.querySelectorAll('.chapter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentChapterLabel.textContent = key === 'ALL' ? 'All Chapters' : label;
      document.getElementById('heroBanner').style.display = activeChapter === 'ALL' ? 'flex' : 'none';
      applyFilters();
      if (window.innerWidth <= 900) closeSidebar();
    });
    return btn;
  }

  // ── Filters ──
  function applyFilters() {
    let result = [...DB];

    if (activeChapter !== 'ALL') {
      result = result.filter(q => q.chapter === activeChapter);
    }
    if (activeType !== 'ALL') {
      result = result.filter(q => q.type === activeType);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.text.toLowerCase().includes(term) ||
        q.chapter.toLowerCase().includes(term) ||
        q.answer.toLowerCase().includes(term)
      );
    }

    filteredQuestions = result;
    renderGrid();
    updateResultsBar();
  }

  function updateResultsBar() {
    const isFiltered = activeChapter !== 'ALL' || activeType !== 'ALL' || searchTerm;
    if (isFiltered) {
      resultsBar.style.display = 'flex';
      resultsCount.textContent = `Showing ${filteredQuestions.length} of ${DB.length} questions`;
    } else {
      resultsBar.style.display = 'none';
    }
  }

  // ── Render Grid ──
  function renderGrid() {
    grid.innerHTML = '';

    if (filteredQuestions.length === 0) {
      noResults.classList.remove('hidden');
      return;
    }
    noResults.classList.add('hidden');

    filteredQuestions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'q-card';
      card.style.animationDelay = `${Math.min(idx * 0.03, 0.4)}s`;

      const stars = q.stars > 0 ? '⭐'.repeat(Math.min(q.stars, 5)) : '';
      card.innerHTML = `
        <div class="q-card-header">
          <span class="q-type-badge ${q.type}">${q.type}</span>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="q-stars">${stars}</span>
            <span class="q-id">Q${q.id}</span>
          </div>
        </div>
        <p class="q-text">${escapeHtml(q.text)}</p>
        <div class="q-footer">
          <span class="q-chapter">${q.chapter}</span>
          <span class="q-arrow">→</span>
        </div>
      `;
      card.addEventListener('click', () => openModal(idx));
      grid.appendChild(card);
    });
  }

  // ── Modal ──
  function openModal(filteredIdx) {
    currentModalIndex = filteredIdx;
    renderModal();
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function renderModal() {
    const q = filteredQuestions[currentModalIndex];
    if (!q) return;

    modalType.className = `mbadge type-badge ${q.type}`;
    modalType.textContent = q.type;
    modalChapter.textContent = q.chapter;
    const stars = q.stars > 0 ? '⭐'.repeat(Math.min(q.stars, 5)) : '';
    modalStars.textContent = stars || '';
    modalStars.style.display = stars ? 'inline' : 'none';
    modalQuestion.textContent = q.text;
    modalAnswer.innerHTML = renderMarkdown(q.answer || 'Answer coming soon...');
    modalQnum.textContent = `Q${q.id} · ${currentModalIndex + 1} / ${filteredQuestions.length}`;
    prevBtn.disabled = currentModalIndex === 0;
    nextBtn.disabled = currentModalIndex === filteredQuestions.length - 1;
    modalOverlay.querySelector('.modal').scrollTo(0, 0);
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // ── Markdown Renderer ──
  function renderMarkdown(text) {
    if (!text) return '';
    let html = text
      // Headers
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Tables (basic)
      .replace(/^\|(.+)\|$/gm, (match) => match)
      // Bold & Italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Horizontal rule
      .replace(/^---+$/gm, '<hr/>')
      // Blockquote
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      // Bullet points
      .replace(/^[*\-] (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      // Newlines
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    // Wrap li items in ul
    html = html.replace(/(<li>.*?<\/li>)(\s*<br\/>)?/gs, (match, li) => {
      return li;
    });

    // Handle tables
    const lines = html.split('\n');
    // Simple table detection already handled by class

    return `<p>${html}</p>`;
  }

  // ── Utils ──
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // ── Sidebar ──
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Event Bindings ──
  function bindEvents() {
    // Type filter buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeType = btn.dataset.type;
        applyFilters();
      });
    });

    // Search
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      applyFilters();
    });

    // Clear filter
    clearFilter?.addEventListener('click', () => {
      searchTerm = '';
      activeType = 'ALL';
      activeChapter = 'ALL';
      searchInput.value = '';
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-type="ALL"]').classList.add('active');
      document.querySelectorAll('.chapter-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('[data-chapter="ALL"]')?.classList.add('active');
      currentChapterLabel.textContent = 'All Chapters';
      document.getElementById('heroBanner').style.display = 'flex';
      applyFilters();
    });

    // Modal
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => {
      if (e.target === modalOverlay) closeModal();
    });
    prevBtn.addEventListener('click', () => {
      if (currentModalIndex > 0) { currentModalIndex--; renderModal(); }
    });
    nextBtn.addEventListener('click', () => {
      if (currentModalIndex < filteredQuestions.length - 1) { currentModalIndex++; renderModal(); }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (!modalOverlay.classList.contains('hidden')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight' && currentModalIndex < filteredQuestions.length - 1) { currentModalIndex++; renderModal(); }
        if (e.key === 'ArrowLeft' && currentModalIndex > 0) { currentModalIndex--; renderModal(); }
      }
    });

    // Sidebar
    menuBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // ── Start ──
  document.addEventListener('DOMContentLoaded', init);
})();
