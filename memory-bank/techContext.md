# Tech Context: cconsent

## Technology Stack

### Core Library
- **Language**: Vanilla JavaScript (ES2020+) with TypeScript type definitions
- **Build Tool**: Rollup with TypeScript plugin
- **Output Formats**: ESM (.mjs), CommonJS (.cjs), UMD (browser)
- **CSS**: Vanilla CSS with CSS variables for theming

### Framework Adapters
- **React**: Context-based provider with hooks (`cconsent-react`)
- **Vue 3**: Plugin architecture with composables (`cconsent-vue`)
- **Svelte**: Store-based with SvelteKit support (`cconsent-svelte`)
- **Build Tool**: tsup for adapter packages

### Development Tools
- **Testing**: Vitest with jsdom
- **Linting**: ESLint with TypeScript plugin
- **Formatting**: Prettier
- **Bundle Analysis**: size-limit

## Project Structure
```
cconsent/
├── src/                    # TypeScript source
│   ├── core/               # Headless modules
│   │   ├── ConsentManager.ts
│   │   ├── StorageAdapter.ts
│   │   ├── ScriptManager.ts
│   │   └── GeoDetector.ts
│   ├── types.ts            # Type definitions
│   └── index.ts            # Main entry point
├── js/                     # Main JS implementation
│   └── cookie-consent.js   # Full implementation with UI
├── css/                    # Styles
│   └── cookie-consent.css
├── packages/               # Framework adapters
│   ├── cconsent-react/
│   ├── cconsent-vue/
│   └── cconsent-svelte/
├── tests/                  # Test files
└── dist/                   # Built output
```

## Key Dependencies
- **Dev only**: rollup, typescript, vitest, eslint, prettier

## Browser Support
- All modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features (async/await, optional chaining)
- Intl.DateTimeFormat for timezone detection

## npm Package Exports
```json
{
  ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs" },
  "./core": { "import": "./dist/core.mjs", "require": "./dist/core.cjs" },
  "./style.css": "./dist/style.css"
}
```
