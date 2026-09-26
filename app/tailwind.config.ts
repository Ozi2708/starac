import type { Config } from 'tailwindcss';

// Tokens du design system Le Grand Prono (docs/06-design-tokens.md).
// Les valeurs vivent en variables CSS (src/styles/tokens.css) ; Tailwind les référence.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        violet: { 950: '#0d0322', 900: '#170643', 800: '#24106a', 700: '#34179a', 600: '#4a24c8', 500: '#6a3cf0', 400: '#8b67ff', 300: '#b7a0ff', 200: '#d8cbff', 100: '#efe8ff' },
        magenta: { 700: '#8e1aa6', 600: '#b42ccc', 500: '#d243e6', 400: '#e679f2', 200: '#f5c6fa' },
        flare: { 600: '#e8650c', 500: '#ff8a1f', 400: '#ffa64a', 200: '#ffd7ab' },
        gold: { 500: '#f5b638', 400: '#ffcb5c', 200: '#ffe8b3' },
        cyan: { 500: '#2fc6f5', 400: '#63d9ff', 200: '#c2f0ff' },
        green: { 500: '#2fd99a', 200: '#b8f5dd' },
        red: { 500: '#ff4a78', 200: '#ffc2d2' },
        page: 'var(--surface-page)',
        raised: 'var(--surface-raised)',
        solid: 'var(--surface-solid)',
        card: 'var(--surface-card)',
        'card-hover': 'var(--surface-card-hover)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        subtle: 'var(--border-subtle)',
        strong: 'var(--border-strong)',
      },
      fontFamily: {
        display: ['Kanit', 'Arial Black', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xs: '6px', sm: '10px', md: '14px', lg: '20px', xl: '28px' },
      spacing: { gutter: '20px', 'nav-h': '72px' },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        pop: 'var(--shadow-pop)',
        'glow-flare': 'var(--glow-flare)',
        'glow-gold': 'var(--glow-gold)',
        'glow-cyan': 'var(--glow-cyan)',
        subtle: 'inset 0 0 0 1px var(--border-subtle)',
      },
      backgroundImage: {
        cta: 'var(--grad-cta)',
        'grad-gold': 'var(--grad-gold)',
        glitter: 'var(--grad-glitter)',
        stage: 'var(--grad-stage)',
        protect: 'var(--grad-protect)',
      },
      transitionTimingFunction: { out: 'cubic-bezier(.2,.8,.2,1)', spring: 'cubic-bezier(.34,1.56,.64,1)' },
      maxWidth: { app: '480px', content: '1200px' },
    },
  },
  plugins: [],
} satisfies Config;
