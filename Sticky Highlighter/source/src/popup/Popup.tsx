import React, { useState, useEffect } from 'react';
import './Popup.css';

// --- Inline Types ---
interface Highlight {
  id: string;
  text: string;
  color: string;
  containerSelector: string;
  createdAt: number;
}

interface StorageData {
  highlights?: Record<string, Highlight[]>;
  isEnabled?: boolean;
}

// Environment Check
const isExtension = typeof chrome !== 'undefined' && !!chrome.storage;

const Popup: React.FC = () => {
  const [highlightsData, setHighlightsData] = useState<Record<string, Highlight[]>>({});
  const [activeTabUrl, setActiveTabUrl] = useState<string | null>(null);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  // Colors mapping for display (Muted Earth theme)
  const colorMap: Record<string, string> = {
    yellow: '#d4cb8a',
    green: '#9ebf9f',
    pink: '#d4a5b4',
    blue: '#95a8b8'
  };

  useEffect(() => {
    loadData();
    if (isExtension) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          const urlObj = new URL(tabs[0].url);
          const cleanUrl = urlObj.origin + urlObj.pathname + urlObj.search;
          setActiveTabUrl(cleanUrl);
          setExpandedUrl(cleanUrl);
        }
      });
    } else {
      // Mock data for preview
      setHighlightsData({
        'https://example.com/article': [
          { id: '1', text: 'This is a very important sentence.', color: 'yellow', containerSelector: 'p', createdAt: Date.now() },
          { id: '2', text: 'Another key point to remember.', color: 'pink', containerSelector: 'div', createdAt: Date.now() - 1000 }
        ]
      });
      setActiveTabUrl('https://example.com/article');
      setExpandedUrl('https://example.com/article');
    }
  }, []);

  const loadData = () => {
    if (isExtension) {
      chrome.storage.local.get(['highlights', 'isEnabled'], (result: StorageData) => {
        if (result.highlights) {
          setHighlightsData(result.highlights);
        }
        if (result.isEnabled !== undefined) {
          setIsEnabled(result.isEnabled);
        }
      });
    }
  };

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    if (isExtension) {
      chrome.storage.local.set({ isEnabled: newState });
    }
  };

  const handleDeleteHighlight = (url: string, id: string) => {
    const updatedData = { ...highlightsData };
    if (updatedData[url]) {
      updatedData[url] = updatedData[url].filter(h => h.id !== id);
      if (updatedData[url].length === 0) {
        delete updatedData[url];
      }
      setHighlightsData(updatedData);
      if (isExtension) {
        chrome.storage.local.set({ highlights: updatedData }, () => {
          // Notify active tab to clear visually
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
              chrome.tabs.sendMessage(tabs[0].id, { type: 'REMOVE_HIGHLIGHT', payload: { id } });
            }
          });
        });
      }
    }
  };

  const handleClearPage = (url: string) => {
    const updatedData = { ...highlightsData };
    delete updatedData[url];
    setHighlightsData(updatedData);
    if (isExtension) {
      chrome.storage.local.set({ highlights: updatedData }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'CLEAR_ALL' });
          }
        });
      });
    }
  };

  const handleExportMarkdown = (url: string) => {
    const pageHighlights = highlightsData[url];
    if (!pageHighlights || pageHighlights.length === 0) return;

    let mdContent = `# Highlights from ${url}\n\n`;
    pageHighlights.forEach(h => {
      mdContent += `> ${h.text}\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const blobUrl = URL.createObjectURL(blob);
    
    if (isExtension) {
      chrome.downloads.download({
        url: blobUrl,
        filename: `highlights-${Date.now()}.md`,
        saveAs: false
      });
    } else {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'highlights.md';
      a.click();
    }
  };

  return (
    <div className="popup-container">
      <header className="header">
        <div className="header-top">
          <span className="cross">+</span>
          <span className="subtitle">PERSISTENT WEB ANNOTATIONS</span>
          <div className="toggle-container" onClick={handleToggle} title={isEnabled ? "Disable extension" : "Enable extension"}>
            <span className="toggle-label">{isEnabled ? 'ON' : 'OFF'}</span>
            <div className={`toggle-switch ${isEnabled ? 'active' : ''}`}>
              <div className="toggle-knob"></div>
            </div>
          </div>
        </div>
        <h1>STICKY<br/>HIGHLIGHTER</h1>
      </header>

      <main className="content">
        {Object.keys(highlightsData).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <h2>NO HIGHLIGHTS<br/>RECORDED</h2>
              <p>SELECT TEXT ON ANY WEBPAGE AND USE THE CONTEXT MENU TO START HIGHLIGHTING.</p>
            </div>
          </div>
        ) : (
          <div className="url-list">
            {Object.keys(highlightsData).map((url) => {
              const isExpanded = expandedUrl === url;
              const isActiveTab = activeTabUrl === url;
              const highlights = highlightsData[url];

              return (
                <div key={url} className={`url-group ${isExpanded ? 'expanded' : ''}`}>
                  <div className="url-header" onClick={() => setExpandedUrl(isExpanded ? null : url)}>
                    <div className="url-info">
                      <span className="url-title">{new URL(url).hostname}</span>
                      <span className="badge">{highlights.length}</span>
                      {isActiveTab && <span className="active-badge">Active Tab</span>}
                    </div>
                    <svg className={`chevron ${isExpanded ? 'rotated' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>

                  {isExpanded && (
                    <div className="highlights-list">
                      <div className="actions-bar">
                        <button className="btn-secondary" style={{ flex: 1 }} onClick={() => handleExportMarkdown(url)}>
                          Export Markdown
                        </button>
                        <button className="btn-danger" onClick={() => handleClearPage(url)}>
                          Clear All
                        </button>
                      </div>

                      {highlights.map((h) => (
                        <div key={h.id} className="highlight-item">
                          <div className="highlight-color-indicator" style={{ backgroundColor: colorMap[h.color] }}></div>
                          <div className="highlight-text">"{h.text}"</div>
                          <button className="delete-btn" onClick={() => handleDeleteHighlight(url, h.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Popup;