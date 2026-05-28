export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  app: {
    baseURL: process.env.NUXT_PUBLIC_BASE_URL,
  },
  runtimeConfig: {
    /* cspell:words http */
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://172.20.10.4:3000/',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://172.20.10.4:3000/',
      iosDownloadUrl: process.env.NUXT_PUBLIC_IOS_DOWNLOAD_URL || 'https://apps.apple.com',
      androidDownloadUrl:
        process.env.NUXT_PUBLIC_ANDROID_DOWNLOAD_URL || 'https://play.google.com/store'
    }
  },
  devServer: {
    host: process.env.NUXT_HOST,
    port: process.env.NUXT_PORT ? parseInt(process.env.NUXT_PORT) : undefined
  }
})
