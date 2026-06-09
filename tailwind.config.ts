import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './server/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FBFF',
          100: '#DDF6FF',
          500: '#64D7D7',
          600: '#0087DC',
          700: '#006CB0',
          aqua: '#64D7D7',
          grass: '#B9EB5F'
        }
      }
    }
  }
}
