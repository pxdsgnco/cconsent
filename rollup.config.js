import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';

export default [
  // Full bundle (UI + Core)
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.mjs', format: 'es', sourcemap: true },
      { file: 'dist/index.cjs', format: 'cjs', sourcemap: true, exports: 'named' },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'CookieConsent',
        sourcemap: true,
        exports: 'default'
      }
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        allowJs: true,
        checkJs: false
      }),
      css({ output: 'style.css' }),
      terser()
    ]
  },
  // Core only (headless)
  {
    input: 'src/core/index.ts',
    output: [
      { file: 'dist/core.mjs', format: 'es', sourcemap: true },
      { file: 'dist/core.cjs', format: 'cjs', sourcemap: true }
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      terser()
    ]
  }
];
