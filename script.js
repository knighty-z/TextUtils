/**
 * TextUtils – Your Everyday Text Toolkit
 * All text processing happens locally in the browser.
 */

(() => {
  'use strict';

  /* ========================================================================
     DOM Elements
     ======================================================================== */
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  const startEditingBtn = document.getElementById('startEditingBtn');
  const brandLogo = document.getElementById('brandLogo');

  const textEditor = document.getElementById('textEditor');
  const editorStatusIndicator = document.getElementById('editorStatusIndicator');
  const editorStatusText = document.getElementById('editorStatusText');
  const editorQuickCount = document.getElementById('editorQuickCount');
  const editorEmptyHint = document.getElementById('editorEmptyHint');

  const btnPaste = document.getElementById('btnPaste');
  const btnUndo = document.getElementById('btnUndo');
  const btnQuickCopy = document.getElementById('btnQuickCopy');
  const btnQuickClear = document.getElementById('btnQuickClear');

  const statTotalChars = document.getElementById('statTotalChars');
  const statCharsNoSpaces = document.getElementById('statCharsNoSpaces');
  const statTotalWords = document.getElementById('statTotalWords');
  const statTotalSentences = document.getElementById('statTotalSentences');
  const statTotalParagraphs = document.getElementById('statTotalParagraphs');

  const toolSearchInput = document.getElementById('toolSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const resetToolSearchBtn = document.getElementById('resetToolSearchBtn');
  const emptySearchState = document.getElementById('emptySearchState');
  const filterPills = document.querySelectorAll('.filter-pill');
  const toolCategories = document.querySelectorAll('.tool-category');
  const toolCards = document.querySelectorAll('.tool-card');
  const textDependentControls = document.querySelectorAll('.requires-text');

  // Find & Replace Modal Elements
  const findReplaceModal = document.getElementById('findReplaceModal');
  const closeFindReplaceModalBtn = document.getElementById('closeFindReplaceModal');
  const cancelFindReplaceBtn = document.getElementById('cancelFindReplaceBtn');
  const findReplaceForm = document.getElementById('findReplaceForm');
  const findInput = document.getElementById('findInput');
  const replaceInput = document.getElementById('replaceInput');
  const caseSensitiveCheckbox = document.getElementById('caseSensitiveCheckbox');
  const matchCountBadge = document.getElementById('matchCountBadge');
  const findReplaceFeedback = document.getElementById('findReplaceFeedback');

  const toastContainer = document.getElementById('toastContainer');

  /* ========================================================================
     Application State
     ======================================================================== */
  const THEME_STORAGE_KEY = 'textutils-theme';
  const MAX_UNDO_HISTORY = 30;
  const undoStack = [];
  let activeCategoryFilter = 'all';
  let lastFocusedBeforeModal = null;

  /* ========================================================================
     Unicode & String Helpers
     ======================================================================== */
  function splitGraphemes(str) {
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      return Array.from(segmenter.segment(str), (seg) => seg.segment);
    }
    return Array.from(str);
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ========================================================================
     Theme Management (Default: Dark)
     ======================================================================== */
  function initTheme() {
    let savedTheme = 'dark';
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch {
      savedTheme = 'dark';
    }
    applyTheme(savedTheme, false);
  }

  function applyTheme(theme, persist = true) {
    htmlEl.setAttribute('data-theme', theme);
    themeToggleBtn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
    themeToggleBtn.setAttribute(
      'title',
      theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );

    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
  }

  function toggleTheme() {
    const currentTheme = htmlEl.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme, true);
    showToast(`Switched to ${nextTheme} theme`, 'info');
  }

  /* ========================================================================
     Navigation & Smooth Scroll
     ======================================================================== */
  function closeMobileMenu() {
    navLinks.classList.remove('open');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
  }

  mobileMenuBtn.addEventListener('click', () => {
    const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
    navLinks.classList.toggle('open', !isExpanded);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  brandLogo.addEventListener('click', () => {
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  startEditingBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const editorSection = document.getElementById('editor-section');
    editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      textEditor.focus({ preventScroll: true });
    }, 350);
  });

  /* ========================================================================
     Live Text Statistics & UI State Sync
     ======================================================================== */
  function computeStatistics(text) {
    if (!text) {
      return {
        totalChars: 0,
        charsNoSpaces: 0,
        totalWords: 0,
        totalSentences: 0,
        totalParagraphs: 0
      };
    }

    const totalChars = splitGraphemes(text).length;
    const charsNoSpaces = splitGraphemes(text.replace(/\s/g, '')).length;

    const trimmed = text.trim();
    const totalWords = trimmed.length > 0 ? trimmed.split(/\s+/).length : 0;

    let totalSentences = 0;
    if (trimmed.length > 0) {
      const sentenceSegments = trimmed
        .split(/[.!?]+(?=\s|$)/)
        .filter((segment) => /[\p{L}\p{N}]/u.test(segment));
      totalSentences = sentenceSegments.length > 0 ? sentenceSegments.length : (/\S/.test(trimmed) ? 1 : 0);
    }

    const totalParagraphs =
      trimmed.length > 0
        ? text.split(/\r?\n/).filter((line) => line.trim().length > 0).length
        : 0;

    return {
      totalChars,
      charsNoSpaces,
      totalWords,
      totalSentences,
      totalParagraphs
    };
  }

  function updateEditorState() {
    const text = textEditor.value;
    const hasText = text.length > 0;
    const stats = computeStatistics(text);

    // Update statistics display
    statTotalChars.textContent = stats.totalChars.toLocaleString();
    statCharsNoSpaces.textContent = stats.charsNoSpaces.toLocaleString();
    statTotalWords.textContent = stats.totalWords.toLocaleString();
    statTotalSentences.textContent = stats.totalSentences.toLocaleString();
    statTotalParagraphs.textContent = stats.totalParagraphs.toLocaleString();

    // Update quick count & status indicator
    const wordLabel = stats.totalWords === 1 ? 'word' : 'words';
    const charLabel = stats.totalChars === 1 ? 'character' : 'characters';
    editorQuickCount.textContent = `${stats.totalWords.toLocaleString()} ${wordLabel} · ${stats.totalChars.toLocaleString()} ${charLabel}`;

    editorStatusIndicator.setAttribute('data-has-text', String(hasText));
    editorStatusText.textContent = hasText ? 'Text Loaded' : 'Empty Editor';

    editorEmptyHint.textContent = hasText
      ? 'Ready to transform. Select any tool below or use the quick toolbar.'
      : 'Type or paste text above to unlock all 23 transformation tools.';

    // Enable/disable controls that require text
    textDependentControls.forEach((control) => {
      control.disabled = !hasText;
    });

    // Enable/disable undo button
    btnUndo.disabled = undoStack.length === 0;
  }

  /* ========================================================================
     Undo Stack Management
     ======================================================================== */
  function pushUndoState(previousText) {
    if (undoStack.length > 0 && undoStack[undoStack.length - 1] === previousText) {
      return;
    }
    undoStack.push(previousText);
    if (undoStack.length > MAX_UNDO_HISTORY) {
      undoStack.shift();
    }
  }

  function performUndo() {
    if (undoStack.length === 0) {
      showToast('Nothing to undo', 'warning');
      return;
    }
    const previousText = undoStack.pop();
    textEditor.value = previousText;
    updateEditorState();
    textEditor.focus();
    showToast('Restored previous text', 'info');
  }

  function applyEditorTransformation(nextText, successMessage, allowUndoToast = false) {
    const currentText = textEditor.value;
    if (nextText === currentText) {
      showToast('No changes were needed for this text', 'info');
      return false;
    }
    pushUndoState(currentText);
    textEditor.value = nextText;
    updateEditorState();
    showToast(successMessage, 'success', allowUndoToast);
    return true;
  }

  /* ========================================================================
     Text Transformation Functions
     ======================================================================== */
  const transformations = {
    // Category 1: Case Conversion
    uppercase(text) {
      return text.toUpperCase();
    },

    lowercase(text) {
      return text.toLowerCase();
    },

    titlecase(text) {
      return text.replace(/\S+/g, (word) => {
        const lowerWord = word.toLowerCase();
        return lowerWord.replace(/\p{L}/u, (char) => char.toUpperCase());
      });
    },

    sentencecase(text) {
      const lower = text.toLowerCase();
      return lower.replace(/(^\s*|[.!?]+\s*|\r?\n+\s*)([^\p{L}\p{N}]*\p{L})/gu, (match, prefix, start) => {
        return prefix + start.replace(/\p{L}/u, (char) => char.toUpperCase());
      });
    },

    capitalizeeach(text) {
      return text
        .toLowerCase()
        .replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu, (match, separator, char) => {
          return separator + char.toUpperCase();
        });
    },

    // Category 2: Space and Separator Tools
    removeextraspaces(text) {
      const normalized = text.replace(/\r\n?/g, '\n');
      const cleanedLines = normalized
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim());
      return cleanedLines
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/^\n+|\n+$/g, '');
    },

    removeallspaces(text) {
      return text.replace(/\s+/g, '');
    },

    spacesToUnderscores(text) {
      return text.replace(/ /g, '_');
    },

    spacesToHyphens(text) {
      return text.replace(/ /g, '-');
    },

    underscoresToSpaces(text) {
      return text.replace(/_/g, ' ');
    },

    addSpacesBetweenChars(text) {
      return text
        .split(/\r?\n/)
        .map((line) => splitGraphemes(line).join(' '))
        .join('\n');
    },

    removeLineBreaks(text) {
      return text.replace(/\r?\n+/g, ' ');
    },

    // Category 3: Text Manipulation
    reverseText(text) {
      return splitGraphemes(text).reverse().join('');
    },

    reverseEachWord(text) {
      return text.replace(/\S+/g, (word) => splitGraphemes(word).reverse().join(''));
    },

    removeDuplicateLines(text) {
      const lines = text.split(/\r?\n/);
      const seen = new Set();
      const uniqueLines = [];

      for (const line of lines) {
        if (!seen.has(line)) {
          seen.add(line);
          uniqueLines.push(line);
        }
      }
      return uniqueLines.join('\n');
    },

    sortLinesAlphabetically(text) {
      const lines = text.split(/\r?\n/);
      return lines
        .sort((a, b) => {
          const baseComparison = a.localeCompare(b, undefined, {
            sensitivity: 'base',
            numeric: true
          });
          return baseComparison !== 0 ? baseComparison : a.localeCompare(b);
        })
        .join('\n');
    },

    removeEmptyLines(text) {
      return text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .join('\n');
    },

    // Category 4: Punctuation Cleanup
    removePunctuation(text) {
      return text.replace(/\p{P}/gu, '');
    }
  };

  const toolMessages = {
    uppercase: 'Converted text to UPPERCASE',
    lowercase: 'Converted text to lowercase',
    titlecase: 'Converted text to Title Case',
    sentencecase: 'Converted text to Sentence Case',
    capitalizeeach: 'Capitalized each word',
    removeextraspaces: 'Removed extra spaces',
    removeallspaces: 'Removed all spaces',
    spacesToUnderscores: 'Replaced spaces with underscores',
    spacesToHyphens: 'Replaced spaces with hyphens',
    underscoresToSpaces: 'Replaced underscores with spaces',
    addSpacesBetweenChars: 'Added spaces between characters',
    removeLineBreaks: 'Removed line breaks',
    reverseText: 'Reversed entire text',
    reverseEachWord: 'Reversed each word',
    removeDuplicateLines: 'Removed duplicate lines',
    sortLinesAlphabetically: 'Sorted lines alphabetically',
    removeEmptyLines: 'Removed empty lines',
    removePunctuation: 'Removed punctuation marks'
  };

  /* ========================================================================
     Clipboard, Download, Clear, Select All Utilities
     ======================================================================== */
  async function copyEditorText() {
    const text = textEditor.value;
    if (!text) {
      showToast('Editor is empty — nothing to copy', 'warning');
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        showToast('Text copied to clipboard', 'success');
        return;
      }
    } catch {
      // Fallback below if Clipboard API is blocked
    }

    // Fallback copy method
    try {
      const tempTextarea = document.createElement('textarea');
      tempTextarea.value = text;
      tempTextarea.setAttribute('readonly', '');
      tempTextarea.style.position = 'fixed';
      tempTextarea.style.left = '-9999px';
      document.body.appendChild(tempTextarea);
      tempTextarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(tempTextarea);

      if (copied) {
        showToast('Text copied to clipboard', 'success');
      } else {
        showToast('Unable to copy automatically. Please press Ctrl+C.', 'error');
      }
    } catch {
      showToast('Clipboard access failed. Please copy manually.', 'error');
    }
  }

  async function pasteFromClipboard() {
    if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
      textEditor.focus();
      showToast('Clipboard paste unavailable here — press Ctrl+V in the editor.', 'warning');
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        showToast('Your clipboard is empty', 'info');
        return;
      }

      const previousText = textEditor.value;
      const start = textEditor.selectionStart ?? previousText.length;
      const end = textEditor.selectionEnd ?? previousText.length;
      const nextText = previousText.slice(0, start) + clipboardText + previousText.slice(end);

      pushUndoState(previousText);
      textEditor.value = nextText;
      updateEditorState();
      textEditor.focus();

      const cursorPos = start + clipboardText.length;
      textEditor.setSelectionRange(cursorPos, cursorPos);
      showToast('Pasted text from clipboard', 'success');
    } catch {
      textEditor.focus();
      showToast('Clipboard permission denied. Use Ctrl+V inside the editor.', 'warning');
    }
  }

  function downloadEditorText() {
    const text = textEditor.value;
    if (!text) {
      showToast('Editor is empty — nothing to download', 'warning');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'textutils-output.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Downloaded textutils-output.txt', 'success');
  }

  function clearEditorText() {
    const text = textEditor.value;
    if (!text) {
      showToast('Editor is already empty', 'info');
      return;
    }

    applyEditorTransformation('', 'Editor cleared', true);
    textEditor.focus();
  }

  function selectAllEditorText() {
    const text = textEditor.value;
    if (!text) {
      showToast('Editor is empty — nothing to select', 'warning');
      return;
    }

    textEditor.focus();
    textEditor.select();
    textEditor.setSelectionRange(0, text.length);
    showToast('All text selected', 'info');
  }

  /* ========================================================================
     Find and Replace Modal
     ======================================================================== */
  function updateMatchPreview() {
    const query = findInput.value;
    const text = textEditor.value;
    findReplaceFeedback.hidden = true;

    if (!query || !text) {
      matchCountBadge.textContent = '0 matches';
      return;
    }

    const flags = caseSensitiveCheckbox.checked ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(query), flags);
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    matchCountBadge.textContent = count === 1 ? '1 match' : `${count} matches`;
  }

  function openFindReplaceModal() {
    if (!textEditor.value) {
      showToast('Enter some text before using Find and Replace', 'warning');
      return;
    }

    lastFocusedBeforeModal = document.activeElement;
    findReplaceFeedback.hidden = true;
    findReplaceModal.hidden = false;
    updateMatchPreview();
    findInput.focus();
  }

  function closeFindReplaceModal() {
    findReplaceModal.hidden = true;
    findReplaceFeedback.hidden = true;
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      lastFocusedBeforeModal.focus();
    }
  }

  findInput.addEventListener('input', updateMatchPreview);
  caseSensitiveCheckbox.addEventListener('change', updateMatchPreview);
  closeFindReplaceModalBtn.addEventListener('click', closeFindReplaceModal);
  cancelFindReplaceBtn.addEventListener('click', closeFindReplaceModal);

  findReplaceModal.addEventListener('click', (event) => {
    if (event.target === findReplaceModal) {
      closeFindReplaceModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !findReplaceModal.hidden) {
      closeFindReplaceModal();
    }
  });

  findReplaceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const searchTerm = findInput.value;
    const replacement = replaceInput.value;
    const currentText = textEditor.value;

    if (!searchTerm) {
      findReplaceFeedback.textContent = 'Please enter a word or phrase to find.';
      findReplaceFeedback.hidden = false;
      findInput.focus();
      return;
    }

    const flags = caseSensitiveCheckbox.checked ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(searchTerm), flags);
    const matches = currentText.match(regex);

    if (!matches || matches.length === 0) {
      findReplaceFeedback.textContent = `No occurrences of "${searchTerm}" were found.`;
      findReplaceFeedback.hidden = false;
      showToast(`No matches found for "${searchTerm}"`, 'warning');
      return;
    }

    const count = matches.length;
    const nextText = currentText.replace(regex, () => replacement);
    const plural = count === 1 ? 'occurrence' : 'occurrences';

    closeFindReplaceModal();
    applyEditorTransformation(nextText, `Replaced ${count} ${plural}`);
  });

  /* ========================================================================
     Tool Execution Dispatcher
     ======================================================================== */
  function handleToolAction(toolKey) {
    if (toolKey === 'findAndReplace') {
      openFindReplaceModal();
      return;
    }
    if (toolKey === 'copyText') {
      copyEditorText();
      return;
    }
    if (toolKey === 'downloadText') {
      downloadEditorText();
      return;
    }
    if (toolKey === 'clearText') {
      clearEditorText();
      return;
    }
    if (toolKey === 'selectAll') {
      selectAllEditorText();
      return;
    }

    const transformFn = transformations[toolKey];
    if (typeof transformFn !== 'function') {
      return;
    }

    const currentText = textEditor.value;
    if (!currentText) {
      showToast('Please enter some text first', 'warning');
      return;
    }

    const nextText = transformFn(currentText);
    const message = toolMessages[toolKey] || 'Text transformed successfully';
    applyEditorTransformation(nextText, message);
  }

  toolCards.forEach((card) => {
    card.addEventListener('click', () => {
      const toolKey = card.dataset.tool;
      if (toolKey) {
        handleToolAction(toolKey);
      }
    });
  });

  /* ========================================================================
     Search & Category Filtering
     ======================================================================== */
  function filterTools() {
    const query = toolSearchInput.value.trim().toLowerCase();
    clearSearchBtn.hidden = query.length === 0;

    let totalVisibleCards = 0;

    toolCategories.forEach((category) => {
      const categoryKey = category.dataset.category;
      const matchesCategory = activeCategoryFilter === 'all' || activeCategoryFilter === categoryKey;

      if (!matchesCategory) {
        category.hidden = true;
        return;
      }

      const cardsInCategory = category.querySelectorAll('.tool-card');
      let visibleInCategory = 0;

      cardsInCategory.forEach((card) => {
        const name = card.querySelector('.tool-name')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
        const keywords = (card.dataset.keywords || '').toLowerCase();

        const isMatch = !query || name.includes(query) || desc.includes(query) || keywords.includes(query);
        card.hidden = !isMatch;
        if (isMatch) {
          visibleInCategory += 1;
          totalVisibleCards += 1;
        }
      });

      const countBadge = category.querySelector('.category-count');
      if (countBadge) {
        countBadge.textContent = visibleInCategory === 1 ? '1 tool' : `${visibleInCategory} tools`;
      }

      category.hidden = visibleInCategory === 0;
    });

    emptySearchState.hidden = totalVisibleCards > 0;
  }

  toolSearchInput.addEventListener('input', filterTools);

  clearSearchBtn.addEventListener('click', () => {
    toolSearchInput.value = '';
    filterTools();
    toolSearchInput.focus();
  });

  resetToolSearchBtn.addEventListener('click', () => {
    toolSearchInput.value = '';
    activeCategoryFilter = 'all';
    filterPills.forEach((pill) => {
      const isAll = pill.dataset.filter === 'all';
      pill.classList.toggle('active', isAll);
      pill.setAttribute('aria-selected', String(isAll));
    });
    filterTools();
    toolSearchInput.focus();
  });

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activeCategoryFilter = pill.dataset.filter || 'all';
      filterPills.forEach((btn) => {
        const isSelected = btn === pill;
        btn.classList.toggle('active', isSelected);
        btn.setAttribute('aria-selected', String(isSelected));
      });
      filterTools();
    });
  });

  /* ========================================================================
     Toast Notification System
     ======================================================================== */
  function showToast(message, type = 'info', includeUndo = false) {
    // Keep at most 3 toasts on screen
    while (toastContainer.children.length >= 3) {
      toastContainer.removeChild(toastContainer.firstChild);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'status');

    const dot = document.createElement('span');
    dot.className = 'toast-dot';
    dot.setAttribute('aria-hidden', 'true');

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-message';
    msgSpan.textContent = message;

    toast.appendChild(dot);
    toast.appendChild(msgSpan);

    if (includeUndo && undoStack.length > 0) {
      const undoBtn = document.createElement('button');
      undoBtn.type = 'button';
      undoBtn.className = 'toast-undo-btn';
      undoBtn.textContent = 'Undo';
      undoBtn.addEventListener('click', () => {
        performUndo();
        toast.remove();
      });
      toast.appendChild(undoBtn);
    }

    toastContainer.appendChild(toast);

    window.setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, includeUndo ? 4500 : 2800);
  }

  /* ========================================================================
     Event Listeners & Initialization
     ======================================================================== */
  themeToggleBtn.addEventListener('click', toggleTheme);
  textEditor.addEventListener('input', updateEditorState);

  btnPaste.addEventListener('click', pasteFromClipboard);
  btnUndo.addEventListener('click', performUndo);
  btnQuickCopy.addEventListener('click', copyEditorText);
  btnQuickClear.addEventListener('click', clearEditorText);

  initTheme();
  updateEditorState();
  filterTools();
})();
