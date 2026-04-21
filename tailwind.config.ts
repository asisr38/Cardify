import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
          dim: 'hsl(var(--muted-dim))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          alt: 'hsl(var(--card-alt))',
        },
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          alt: 'hsl(var(--gold-alt))',
          dim: 'hsl(var(--gold-dim))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 20px rgba(0, 0, 0, 0.45)',
        soft: '0 2px 8px rgba(0, 0, 0, 0.3)',
        lift: '0 8px 28px rgba(0, 0, 0, 0.55)',
        gold: '0 4px 20px hsl(var(--gold-glow))',
        'gold-lg': '0 6px 24px hsl(var(--gold-glow-strong))',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scan-line': {
          '0%':   { top: '10%', opacity: '1' },
          '100%': { top: '90%', opacity: '0.2' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 hsl(var(--gold) / 0.4)' },
          '50%':      { opacity: '0.7', boxShadow: '0 0 0 6px hsl(var(--gold) / 0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 360ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'fade-in': 'fade-in 320ms ease',
        'scan-line': 'scan-line 1.3s ease-in-out forwards',
        'pulse-glow': 'pulse-glow 2s infinite',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
