/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0a0604',      // Preto profundo (fundo medieval)
        secondary: '#2b1f1a',    // Marrom escuro (madeira)
        accent: '#8b6f47',       // Bronze/ouro escuro
        highlight: '#d4af37',    // Ouro puro
        'stone-dark': '#3d2817', // Pedra escura
        'gold-light': '#f0e68c', // Ouro claro
        'blood': '#8b2e2e',      // Vermelho sangue (medieval)
      },
    },
  },
  plugins: [],
}
