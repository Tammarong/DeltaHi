export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: ['@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  runtimeConfig: {
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://deltahi.vercel.io',
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://deltahi.vercel.io',
      iosDownloadUrl: process.env.NUXT_PUBLIC_IOS_DOWNLOAD_URL || 'https://apps.apple.com',
      androidDownloadUrl:
        process.env.NUXT_PUBLIC_ANDROID_DOWNLOAD_URL || 'https://play.google.com/store'
    }
  }
})
