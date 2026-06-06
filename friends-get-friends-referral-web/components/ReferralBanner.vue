<script setup lang="ts">
import appDeltaHiLogoUrl from '~/assets/img/App_DeltaHi_Logo.png'

defineProps<{
  title: string
  description: string
  variant: 'download' | 'verify'
}>()
</script>

<template>
  <div class="rounded-lg border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm">
    <div class="flex items-center gap-4">
      <div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-sky-100/80">
        <div
          v-if="variant === 'download'"
          class="relative flex h-14 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-950 p-1 shadow-sm"
        >
          <div class="absolute top-1 h-1 w-4 rounded-full bg-slate-700" />
          <div class="flex h-full w-full items-center justify-center rounded-md bg-gradient-to-b from-sky-500 to-emerald-300">
            <img
              :src="appDeltaHiLogoUrl"
              alt=""
              class="h-6 w-6 rounded bg-white/90 p-0.5"
            >
          </div>
        </div>

        <svg
          v-else
          class="h-12 w-12 text-brand-700"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M24 5 40 11v11c0 10.5-6.4 17-16 21-9.6-4-16-10.5-16-21V11l16-6Z"
            fill="#E7F8FF"
            stroke="currentColor"
            stroke-width="3"
            stroke-linejoin="round"
          />
          <path
            d="m16.5 24 5 5 11-12"
            stroke="#159A87"
            stroke-width="3.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>

      <div class="min-w-0">
        <p class="text-base font-semibold leading-6 text-slate-950">
          {{ title }}
        </p>
        <p class="mt-1 text-sm leading-6 text-slate-600">
          {{ description }}
        </p>
      </div>
    </div>
  </div>
</template>
