console.log('[Sticky Highlighter] Background service worker started');

const createContextMenus = () => {
  chrome.contextMenus.create({
    id: "sticky-highlighter-main",
    title: "Highlight Text",
    contexts: ["selection"]
  });

  const colors = [
    { id: 'yellow', title: 'Yellow' },
    { id: 'green', title: 'Green' },
    { id: 'pink', title: 'Pink' },
    { id: 'blue', title: 'Blue' }
  ];

  colors.forEach(color => {
    chrome.contextMenus.create({
      id: `hl-${color.id}`,
      parentId: "sticky-highlighter-main",
      title: color.title,
      contexts: ["selection"]
    });
  });
};

// Initialize Context Menus based on enabled state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled !== false) {
      createContextMenus();
    }
  });
});

// Watch for toggle changes to add/remove context menus dynamically
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.isEnabled) {
    if (changes.isEnabled.newValue === false) {
      chrome.contextMenus.removeAll();
    } else {
      chrome.contextMenus.removeAll(() => {
        createContextMenus();
      });
    }
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.toString().startsWith('hl-') && tab?.id) {
    const colorId = info.menuItemId.toString().split('-')[1];
    chrome.tabs.sendMessage(tab.id, {
      type: 'HIGHLIGHT_CONTEXT_MENU',
      payload: { color: colorId }
    });
  }
});

export {};