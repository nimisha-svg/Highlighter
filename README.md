# Sticky Highlighter

Version: 1.0.0

## Description
Highlight text on any webpage and have those highlights persist indefinitely.

## 🚀 Quick Start (Pre-built)

This extension comes pre-built and ready to use!

1. Extract this ZIP file to a folder on your computer
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top right
4. Click "Load unpacked" button
5. Select the extracted folder
6. The extension should now be installed and active!

## ⚛️ Development Setup (Modify Source)

This is a React TypeScript extension. To modify and rebuild, you can find the source code in the `source/` directory:

### Prerequisites (for developers)
- Node.js 18+ installed
- npm or yarn

### Steps to modify:
1. Copy all contents from the `source/` folder to a new root directory
2. Run `npm install`
3. Run `npm run build` to update the extension files in the root

## 📁 Project Structure

```
├── manifest.json        # Extension manifest
├── popup.html           # Popup HTML template
├── popup.js             # Bundled popup code
├── popup.css            # Popup styles
├── content.js           # Bundled content script
├── background.js        # Bundled service worker
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── src/                 # Source files
│   ├── popup/
│   │   ├── Popup.tsx    # Main React component
│   │   ├── index.tsx    # Entry point
│   │   └── Popup.css    # Component styles
│   ├── content/
│   │   └── content.tsx  # Content script
│   ├── background/
│   │   └── background.ts # Service worker
│   └── types/
│       └── index.ts     # TypeScript types
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── esbuild.config.js    # Build configuration
└── .env.example         # Environment variables template
```

## 🔑 API Key Configuration

If this extension uses AI features, you'll need to configure your own API keys:

1. Look for the `.env.example` file in the `source/` folder
2. Copy it to `.env`: `cp source/.env.example source/.env`
3. Edit the `.env` file and add your own API keys:
   - Get a Groq API key at: https://console.groq.com/
   - Get a Parallel Search key at: https://parallelsearch.ai/

**Note**: For security reasons, the extension package does not include pre-configured API keys.

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **esbuild** - Fast bundler
- **Chrome Extension Manifest V3**

## Publishing to Chrome Web Store

1. Create a developer account at https://chrome.google.com/webstore/devconsole
2. Pay the one-time $5 registration fee
3. Click "New Item" and upload this ZIP file
4. Fill in the required store listing details
5. Submit for review

## Support

For issues or questions, please refer to:
- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [React Documentation](https://react.dev/)

---
Built with Chrome Extension Builder (AI-Powered)
⚛️ React TypeScript Extension
