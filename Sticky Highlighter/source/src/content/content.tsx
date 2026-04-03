// Sticky Highlighter Content Script
console.log('[Sticky Highlighter] Content script initialized');

interface Highlight {
  id: string;
  text: string;
  color: string;
  containerSelector: string;
  createdAt: number;
}

let currentSelection: Selection | null = null;
let currentRange: Range | null = null;
let toolbarElement: HTMLDivElement | null = null;
let isExtensionEnabled = true;

// Inject CSS to hide highlights when disabled
const initDisabledStyles = () => {
  if (!document.getElementById('sticky-hl-styles')) {
    const style = document.createElement('style');
    style.id = 'sticky-hl-styles';
    style.textContent = `
      body.sticky-hl-disabled .sticky-hl-mark {
        background-color: transparent !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);
  }
};
initDisabledStyles();

const toggleExtensionState = (enabled: boolean) => {
  isExtensionEnabled = enabled;
  if (enabled) {
    document.body.classList.remove('sticky-hl-disabled');
  } else {
    document.body.classList.add('sticky-hl-disabled');
    hideToolbar();
  }
};

const HIGHLIGHT_COLORS = [
  { id: 'yellow', hex: '#d4cb8a' },
  { id: 'green', hex: '#9ebf9f' },
  { id: 'pink', hex: '#d4a5b4' },
  { id: 'blue', hex: '#95a8b8' }
];

// 1. Utility: Generate a stable CSS selector for an element
const getCssSelector = (el: Element): string => {
  if (el.tagName.toLowerCase() === 'body') return 'body';
  if (el.id) return `#${el.id}`;
  let path = [];
  let current: Element | null = el;
  while (current && current.tagName.toLowerCase() !== 'body') {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break;
    } else {
      let sibling = current;
      let nth = 1;
      while (sibling.previousElementSibling) {
        sibling = sibling.previousElementSibling;
        if (sibling.tagName.toLowerCase() === selector) {
          nth++;
        }
      }
      if (nth !== 1) {
        selector += `:nth-of-type(${nth})`;
      }
      if (current.className && typeof current.className === 'string') {
        const classes = current.className.split(/\s+/).filter(c => c && !c.includes('sticky-hl')).join('.');
        if (classes) selector += `.${classes}`;
      }
    }
    path.unshift(selector);
    current = current.parentElement;
  }
  return path.join(' > ');
};

// 2. Toolbar Management
const createToolbar = () => {
  if (toolbarElement) return;
  toolbarElement = document.createElement('div');
  toolbarElement.id = 'sticky-highlighter-toolbar';
  toolbarElement.style.cssText = `
    position: absolute;
    z-index: 2147483647;
    background: #1e293b;
    border-radius: 8px;
    padding: 6px;
    display: flex;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border: 1px solid #334155;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s;
  `;

  HIGHLIGHT_COLORS.forEach(({ id, hex }) => {
    const btn = document.createElement('button');
    btn.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid transparent;
      background-color: ${hex};
      cursor: pointer;
      transition: transform 0.1s;
    `;
    btn.onmouseover = () => btn.style.transform = 'scale(1.1)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';
    btn.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      applyHighlight(id);
      hideToolbar();
    };
    toolbarElement?.appendChild(btn);
  });

  document.body.appendChild(toolbarElement);
};

const showToolbar = (rect: DOMRect) => {
  if (!toolbarElement) createToolbar();
  const top = window.scrollY + rect.top - 45;
  const left = window.scrollX + rect.left + (rect.width / 2) - 60;
  
  toolbarElement!.style.top = `${Math.max(0, top)}px`;
  toolbarElement!.style.left = `${Math.max(0, left)}px`;
  toolbarElement!.style.visibility = 'visible';
  toolbarElement!.style.opacity = '1';
};

const hideToolbar = () => {
  if (toolbarElement) {
    toolbarElement.style.opacity = '0';
    setTimeout(() => {
      if (toolbarElement) toolbarElement.style.visibility = 'hidden';
    }, 100);
  }
};

// 3. Selection Handling
document.addEventListener('mouseup', (e) => {
  // Ignore clicks inside our own toolbar
  if ((e.target as Element).closest('#sticky-highlighter-toolbar')) return;
  if (!isExtensionEnabled) return;

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (selection && text && text.length > 0) {
      currentSelection = selection;
      currentRange = selection.getRangeAt(0);
      const rect = currentRange.getBoundingClientRect();
      showToolbar(rect);
    } else {
      hideToolbar();
    }
  }, 10);
});

document.addEventListener('mousedown', (e) => {
  if (!(e.target as Element).closest('#sticky-highlighter-toolbar')) {
    hideToolbar();
  }
});

// 4. Core Highlight Logic
const applyHighlight = (colorId: string) => {
  if (!isExtensionEnabled) return;
  if (!currentRange || !currentSelection) return;

  const text = currentSelection.toString().trim();
  const container = currentRange.commonAncestorContainer;
  const elementContainer = container.nodeType === 3 ? container.parentElement : container as Element;
  
  if (!elementContainer) return;
  const selector = getCssSelector(elementContainer);
  
  const id = `hl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  
  const highlightData: Highlight = {
    id,
    text,
    color: colorId,
    containerSelector: selector,
    createdAt: Date.now()
  };

  saveHighlight(highlightData);
  wrapTextInDOM(highlightData, true); // true = smooth transition if possible
  window.getSelection()?.removeAllRanges();
};

const wrapTextInDOM = (hl: Highlight, animate = false) => {
  const colorHex = HIGHLIGHT_COLORS.find(c => c.id === hl.color)?.hex || '#fef08a';
  
  // Implementation of a text-search based wrapper for robustness across dynamic DOMs
  const container = document.querySelector(hl.containerSelector);
  if (!container) return;

  // We use a tree walker to find text nodes containing the text
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node;
  const textNodes = [];
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Simplified logic: If the exact text exists in the container, wrap it.
  // Note: Handling selections crossing multiple elements is highly complex. 
  // This MVP focuses on robust single-node/container highlighting.
  
  const walkerRegex = new RegExp(`(${escapeRegExp(hl.text)})`, 'g');
  
  // To avoid breaking existing HTML, we manipulate innerHTML carefully or replace text nodes.
  // For safety and to handle formatting correctly, replacing innerHTML of the container is risky.
  // Let's find the specific text node that contains the string.
  
  for (let tNode of textNodes) {
    if (tNode.nodeValue && tNode.nodeValue.includes(hl.text) && !tNode.parentElement?.classList.contains('sticky-hl-mark')) {
      const parent = tNode.parentElement;
      if (parent) {
        const replacement = tNode.nodeValue.replace(
          hl.text, 
          `<mark class="sticky-hl-mark" data-hl-id="${hl.id}" style="background-color: ${colorHex}; border-radius: 3px; padding: 0 2px; color: inherit;">${hl.text}</mark>`
        );
        // Replace node cautiously
        const span = document.createElement('span');
        span.innerHTML = replacement;
        parent.replaceChild(span, tNode);
        break; // Only apply once per highlight object
      }
    }
  }
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 5. Storage & Hydration
const getCleanUrl = () => {
  return window.location.origin + window.location.pathname + window.location.search;
};

const saveHighlight = (hl: Highlight) => {
  const url = getCleanUrl();
  chrome.storage.local.get(['highlights'], (result) => {
    const highlights = result.highlights || {};
    if (!highlights[url]) highlights[url] = [];
    highlights[url].push(hl);
    chrome.storage.local.set({ highlights });
  });
};

const hydrateHighlights = () => {
  const url = getCleanUrl();
  chrome.storage.local.get(['highlights', 'isEnabled'], (result) => {
    if (result.isEnabled !== undefined) toggleExtensionState(result.isEnabled);
    
    if (result.highlights && result.highlights[url]) {
      const pageHighlights: Highlight[] = result.highlights[url];
      pageHighlights.forEach(hl => {
        try {
          wrapTextInDOM(hl);
        } catch (e) {
          console.warn('[Sticky Highlighter] Failed to restore a highlight', e);
        }
      });
    }
  });
};

// 6. Messaging & State Sync
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isEnabled) {
    toggleExtensionState(changes.isEnabled.newValue);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLEAR_ALL') {
    document.querySelectorAll('.sticky-hl-mark').forEach(el => {
      const text = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(text, el);
    });
  } else if (message.type === 'REMOVE_HIGHLIGHT') {
    const id = message.payload.id;
    document.querySelectorAll(`.sticky-hl-mark[data-hl-id="${id}"]`).forEach(el => {
      const text = document.createTextNode(el.textContent || '');
      el.parentNode?.replaceChild(text, el);
    });
  } else if (message.type === 'HIGHLIGHT_CONTEXT_MENU') {
     // Triggered via context menu
     applyHighlight(message.payload.color);
  }
});

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', hydrateHighlights);
} else {
  hydrateHighlights();
}

// 7. Dynamic SPA Support via MutationObserver
let hydrationTimeout: NodeJS.Timeout;
const observer = new MutationObserver((mutations) => {
  let shouldRehydrate = false;
  for (let m of mutations) {
    if (m.addedNodes.length > 0) {
      shouldRehydrate = true;
      break;
    }
  }
  if (shouldRehydrate) {
    clearTimeout(hydrationTimeout);
    hydrationTimeout = setTimeout(hydrateHighlights, 1000); // Debounce
  }
});

observer.observe(document.body, { childList: true, subtree: true });

export {};