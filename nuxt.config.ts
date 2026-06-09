export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'en',
    strategy: 'no_prefix',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'th', name: 'Thai', file: 'th.json' }
    ]
  },
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    baseURL: process.env.NUXT_PUBLIC_BASE_URL,
    head: {
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'apple-touch-icon', sizes: '120x120', href: '/apple-touch-icon-120x120.png' },
        { rel: 'apple-touch-icon-precomposed', sizes: '180x180', href: '/apple-touch-icon-precomposed.png' },
        { rel: 'apple-touch-icon-precomposed', sizes: '120x120', href: '/apple-touch-icon-120x120-precomposed.png' }
      ]
    }
  },
  runtimeConfig: {
    /* cspell:words http */
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    public: {
      downloadUrl: process.env.NUXT_PUBLIC_DOWNLOAD_URL
    }
  },
  devServer: {
    host: process.env.NUXT_HOST,
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : undefined
  }
})
