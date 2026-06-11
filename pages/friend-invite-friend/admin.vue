<script setup lang="ts">

import deltaLogoUrl from '~/assets/img/Delta_Logo.png'
import deltaHiBannerUrl from '~/assets/img/DeltaHi Banner.svg'

type DashboardDownload = {
  id: string
  no: number
  receiverName: string
  receiverEmpId: string
  referrerName: string
  referrerEmpId: string
  os: string
  downloadedAt: string
  status: 'Verified' | 'Unverified'
}

type DashboardPioneer = {
  rank: number
  name: string
  employeeId: string
  refers: number
  score: number
  qualified?: boolean
}

type DashboardWinner = {
  rank: number
  name: string
  employeeId: string
  referrerName: string
  referrerEmpId: string
  os: string
  downloadedAt: string
}

type AdminDashboardResponse = {
  stats: {
    totalDownloads: number
    allUsersFromApp: number
    newUsers: number
    campaignUsers: number
    first38Users: number
    pioneerSlots: number
    avgRefers: number
  }
  recentDownloads: DashboardDownload[]
  pagination: {
    page: number
    pageSize: number
    total: number
    pageCount: number
  }
  topPioneers: DashboardPioneer[]
  first38Winners: DashboardWinner[]
}

const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined
const osFilter = ref<'all' | 'ios' | 'android' | 'unknown'>('all')
const verificationStatusFilter = ref<'all' | 'verified' | 'unverified'>('all')
const dateFromFilter = ref('')
const dateToFilter = ref('')
const currentPage = ref(1)
const showWinnersDialog = ref(false)
const winnerSort = ref<'highest' | 'lowest'>('highest')
const winnerPage = ref(1)
const pageSize = 10
const winnerPageSize = 10
const numberFormatter = new Intl.NumberFormat('en-US')
const downloadedAtFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok'
})
const dashboardQuery = computed(() => ({
  page: currentPage.value,
  pageSize,
  search: debouncedSearchQuery.value.trim() || undefined,
  os: osFilter.value === 'all' ? undefined : osFilter.value,
  verificationStatus: verificationStatusFilter.value === 'all' ? undefined : verificationStatusFilter.value,
  dateFrom: dateFromFilter.value || undefined,
  dateTo: dateToFilter.value || undefined
}))

const {
  data: dashboard,
  pending,
  error,
  refresh
} = await useFetch<AdminDashboardResponse>('/api/admin/dashboard', {
  query: dashboardQuery,
  watch: false
})

const stats = computed(() => dashboard.value?.stats ?? {
  totalDownloads: 0,
  allUsersFromApp: 0,
  newUsers: 0,
  campaignUsers: 0,
  first38Users: 0,
  pioneerSlots: 38,
  avgRefers: 0
})

const first38Progress = computed(() => {
  if (!stats.value.pioneerSlots) {
    return 0
  }

  return Math.min(100, Math.round((stats.value.first38Users / stats.value.pioneerSlots) * 100))
})

const statCards = computed(() => {
  return [
    {
      label: 'All Users From App',
      value: numberFormatter.format(stats.value.allUsersFromApp),
      helper: 'Mock total from app',
      tone: 'blue',
      icon: 'app'
    },
    {
      label: 'New User',
      value: numberFormatter.format(stats.value.newUsers),
      helper: 'Verified users only',
      tone: 'green',
      icon: 'user'
    },
    {
      label: 'New User From Campaign',
      value: numberFormatter.format(stats.value.campaignUsers),
      helper: 'Verified + unverified',
      tone: 'blue',
      icon: 'download'
    },
    {
      label: 'Top 38',
      value: numberFormatter.format(stats.value.first38Users),
      helper: `/ ${stats.value.pioneerSlots}`,
      trend: `${first38Progress.value}%`,
      tone: 'yellow',
      icon: 'trophy'
    }
  ] as const
})

const activityRows = computed(() => dashboard.value?.recentDownloads ?? [])
const pagination = computed(() => dashboard.value?.pagination ?? {
  page: currentPage.value,
  pageSize,
  total: 0,
  pageCount: 1
})
const pioneers = computed(() => dashboard.value?.topPioneers ?? [])
const pioneerSlotsText = computed(() =>
  `${numberFormatter.format(stats.value.first38Users)}/${numberFormatter.format(stats.value.pioneerSlots)}`
)
const pioneerStatusLabel = computed(() =>
  stats.value.first38Users >= stats.value.pioneerSlots ? 'Qualified' : 'In Progress'
)
const hasActiveFilters = computed(() =>
  Boolean(debouncedSearchQuery.value.trim()) ||
  osFilter.value !== 'all' ||
  verificationStatusFilter.value !== 'all' ||
  Boolean(dateFromFilter.value) ||
  Boolean(dateToFilter.value)
)
const activitySummary = computed(() => {
  const visibleCount = activityRows.value.length
  const totalCount = pagination.value.total

  if (!totalCount) {
    return 'Showing 0 downloads'
  }

  const start = ((pagination.value.page - 1) * pagination.value.pageSize) + 1
  const end = start + visibleCount - 1
  const suffix = hasActiveFilters.value ? 'filtered downloads' : 'downloads'

  return `Showing ${start}-${end} of ${numberFormatter.format(totalCount)} ${suffix}`
})
const canGoPreviousPage = computed(() => pagination.value.page > 1 && !pending.value)
const canGoNextPage = computed(() => pagination.value.page < pagination.value.pageCount && !pending.value)
const sortedWinnerRows = computed(() => {
  return [...pioneers.value].sort((firstPioneer, secondPioneer) => {
    const referDifference = firstPioneer.refers - secondPioneer.refers

    if (referDifference) {
      return winnerSort.value === 'highest' ? -referDifference : referDifference
    }

    return winnerSort.value === 'highest'
      ? firstPioneer.rank - secondPioneer.rank
      : secondPioneer.rank - firstPioneer.rank
  })
})
const winnerPageCount = computed(() =>
  Math.max(1, Math.ceil(sortedWinnerRows.value.length / winnerPageSize))
)
const paginatedWinnerRows = computed(() => {
  const start = (winnerPage.value - 1) * winnerPageSize

  return sortedWinnerRows.value.slice(start, start + winnerPageSize)
})
const winnerSummary = computed(() => {
  const total = sortedWinnerRows.value.length

  if (!total) {
    return 'Showing 0 winners'
  }

  const start = ((winnerPage.value - 1) * winnerPageSize) + 1
  const end = start + paginatedWinnerRows.value.length - 1

  return `Showing ${start}-${end} of ${numberFormatter.format(total)} winners`
})
const canGoPreviousWinnerPage = computed(() => winnerPage.value > 1)
const canGoNextWinnerPage = computed(() => winnerPage.value < winnerPageCount.value)

watch(searchQuery, (value) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  searchDebounceTimer = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 350)
})

watch([debouncedSearchQuery, osFilter, verificationStatusFilter, dateFromFilter, dateToFilter], () => {
  const isAlreadyFirstPage = currentPage.value === 1

  currentPage.value = 1

  if (isAlreadyFirstPage) {
    refreshDashboard()
  }
})

watch(currentPage, () => {
  refreshDashboard()
})

watch([winnerSort, pioneers], () => {
  winnerPage.value = 1
})

function refreshDashboard() {
  void refresh()
}

onBeforeUnmount(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
})

function formatDownloadedAt(value: string) {
  return downloadedAtFormatter.format(new Date(value))
}

function formatOs(os: string) {
  if (os === 'ios') {
    return 'iOS'
  }

  if (os === 'android') {
    return 'Android'
  }

  return 'Unknown'
}

function goToPreviousPage() {
  if (!canGoPreviousPage.value) {
    return
  }

  currentPage.value = Math.max(1, currentPage.value - 1)
}

function goToNextPage() {
  if (!canGoNextPage.value) {
    return
  }

  currentPage.value = Math.min(pagination.value.pageCount, currentPage.value + 1)
}

async function resetFilters() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = undefined
  }

  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  osFilter.value = 'all'
  verificationStatusFilter.value = 'all'
  dateFromFilter.value = ''
  dateToFilter.value = ''
  currentPage.value = 1

  await refresh()
}

function exportCsv() {
  if (!import.meta.client) {
    return
  }

  const params = new URLSearchParams()

  if (debouncedSearchQuery.value.trim()) {
    params.set('search', debouncedSearchQuery.value.trim())
  }

  if (osFilter.value !== 'all') {
    params.set('os', osFilter.value)
  }

  if (verificationStatusFilter.value !== 'all') {
    params.set('verificationStatus', verificationStatusFilter.value)
  }

  if (dateFromFilter.value) {
    params.set('dateFrom', dateFromFilter.value)
  }

  if (dateToFilter.value) {
    params.set('dateTo', dateToFilter.value)
  }

  const queryString = params.toString()
  window.location.href = `/api/admin/downloads.csv${queryString ? `?${queryString}` : ''}`
}

function escapeClientCsvValue(value: string | number) {
  const stringValue = String(value)

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`
  }

  return stringValue
}

function downloadClientCsv(filename: string, rows: Array<Array<string | number>>) {
  if (!import.meta.client) {
    return
  }

  const csv = `\uFEFF${rows
    .map((row) => row.map(escapeClientCsvValue).join(','))
    .join('\n')}\n`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportWinnersCsv() {
  downloadClientCsv('top-38-pioneers.csv', [
    ['Rank', 'Referrer Name', 'Referrer Employee ID', 'Refers', 'Score'],
    ...sortedWinnerRows.value.map((pioneer) => [
      pioneer.rank,
      pioneer.name,
      pioneer.employeeId,
      pioneer.refers,
      pioneer.score
    ])
  ])
}

function openWinnersDialog() {
  winnerPage.value = 1
  showWinnersDialog.value = true
}

function closeWinnersDialog() {
  showWinnersDialog.value = false
}

function goToPreviousWinnerPage() {
  if (!canGoPreviousWinnerPage.value) {
    return
  }

  winnerPage.value = Math.max(1, winnerPage.value - 1)
}

function goToNextWinnerPage() {
  if (!canGoNextWinnerPage.value) {
    return
  }

  winnerPage.value = Math.min(winnerPageCount.value, winnerPage.value + 1)
}

useHead({
  title: 'Admin Dashboard | Friends Get Friends'
})
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[#f4f8fb] text-[#17324d]">
    <header class="border-b border-[#c9d8e8] bg-white/95">
      <div class="mx-auto flex min-h-[56px] w-full max-w-7xl items-center px-5 py-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <img
            :src="deltaLogoUrl"
            alt="Delta"
            class="h-auto w-32 shrink-0"
          >
          <h1 class="mt-4 border-l border-[#c9d8e8] pl-3 text-xl font-bold leading-none tracking-normal text-[#17324d]">
            Dashboard Overview
          </h1>
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:py-6">
      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article
          v-for="card in statCards"
          :key="card.label"
          class="relative min-h-[132px] rounded-lg border border-[#d7e2ec] bg-white p-4 shadow-[0_1px_2px_rgba(23,50,77,0.06)]"
        >
          <div
            v-if="card.label === 'Top 38' && first38Progress >= 100"
            class="absolute right-0 top-0 rounded-bl-sm rounded-tr-lg bg-[#f5b400] px-3 py-1 text-[9px] font-extrabold uppercase text-[#17324d]"
          >
            Goal Reached
          </div>

          <div class="flex items-start justify-between gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
              :class="{
                'bg-[#e7f6ed] text-[#128041]': card.tone === 'green',
                'bg-[#e8f4fb] text-[#008bd2]': card.tone === 'blue',
                'bg-[#fff7df] text-[#b77900]': card.tone === 'yellow'
              }"
            >
              <svg v-if="card.icon === 'app'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="7" y="3" width="10" height="18" rx="2" />
                <path d="M10 17h4" />
              </svg>
              <svg v-else-if="card.icon === 'download'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 3v10" />
                <path d="m8 9 4 4 4-4" />
                <path d="M5 17v3h14v-3" />
              </svg>
              <svg v-else-if="card.icon === 'user'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="8" r="3" />
                <path d="M6 20c1.3-3 3.3-4.5 6-4.5s4.7 1.5 6 4.5" />
              </svg>
              <svg v-else class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                <path d="M6 6H4v2a4 4 0 0 0 4 4" />
                <path d="M18 6h2v2a4 4 0 0 1-4 4" />
                <path d="M12 13v5" />
                <path d="M9 20h6" />
              </svg>
            </div>

          </div>

          <div class="mt-3">
            <p class="text-[11px] font-extrabold leading-4 text-[#5a6b7c]">{{ card.label }}</p>
            <p class="mt-1 text-[28px] font-black leading-8 tracking-normal text-[#17324d]">
              {{ card.value }}
              <span v-if="card.label === 'Top 38'" class="text-base font-semibold text-[#17324d]">
                {{ card.helper }}
              </span>
            </p>
            <p v-if="card.label !== 'Top 38'" class="mt-1 text-[11px] font-semibold leading-4 text-[#17324d]">
              {{ card.helper }}
            </p>
            <div v-else class="mt-3 h-2 rounded-full bg-[#edf2f7]">
              <div class="h-full rounded-full bg-[#008bd2]" :style="{ width: `${first38Progress}%` }" />
            </div>
          </div>
        </article>
      </section>

      <div class="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section class="min-w-0 space-y-4">
          <section class="rounded-lg border border-[#d7e2ec] bg-white p-4 shadow-[0_1px_2px_rgba(23,50,77,0.06)]">
            <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.2fr)_118px_142px_140px_140px] xl:items-end">
              <label class="min-w-0">
                <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">Search</span>
                <span class="relative block">
                  <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5a6b7c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  <input
                    v-model="searchQuery"
                    type="search"
                    placeholder="Name or employee ID"
                    class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] pl-10 pr-3 text-xs font-medium text-[#17324d] outline-none transition placeholder:text-[#6b7d90] focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
                  >
                </span>
              </label>

              <label class="min-w-0">
                <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">OS</span>
                <select
                  v-model="osFilter"
                  class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-bold text-[#17324d] outline-none transition focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
                >
                  <option value="all">All OS</option>
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label class="min-w-0">
                <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">Status</span>
                <select
                  v-model="verificationStatusFilter"
                  class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-bold text-[#17324d] outline-none transition focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
                >
                  <option value="all">All Status</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </label>

              <label class="min-w-0">
                <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">From</span>
                <input
                  v-model="dateFromFilter"
                  type="date"
                  class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-bold text-[#17324d] outline-none transition focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
                >
              </label>

              <label class="min-w-0">
                <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">To</span>
                <input
                  v-model="dateToFilter"
                  type="date"
                  class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-bold text-[#17324d] outline-none transition focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
                >
              </label>
            </div>
          </section>

          <section class="min-w-0 overflow-hidden rounded-lg border border-[#d7e2ec] bg-white shadow-[0_1px_2px_rgba(23,50,77,0.06)]">
            <div class="flex items-center justify-between gap-4 border-b border-[#d7e2ec] px-5 py-5">
              <h2 class="text-lg font-extrabold text-[#17324d]">New User Records</h2>
              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  class="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-semibold text-[#008bd2] transition hover:bg-[#e8f4fb] hover:text-[#0067a6] border border-[#c9d8e8] bg-[#f7fbff]"
                  @click="exportCsv"
                >
                  Export CSV
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 3v12" />
                    <path d="m8 11 4 4 4-4" />
                    <path d="M5 21h14" />
                    <path d="M19 15v6H5v-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9d8e8] bg-[#f7fbff] text-[#008bd2] transition hover:bg-[#e8f4fb]"
                  aria-label="Reset filters"
                  title="Reset filters"
                  @click="resetFilters"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 0 1 15.2-6.5" />
                    <path d="M18 2v4h-4" />
                    <path d="M21 12a9 9 0 0 1-15.2 6.5" />
                    <path d="M6 22v-4h4" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="error" class="px-5 py-8 text-sm font-semibold text-red-700">
              Unable to load dashboard records.
            </div>

            <div v-else class="relative min-h-[210px]" :aria-busy="pending">
              <div
                class="overflow-x-auto transition-all duration-300 ease-out"
                :class="pending ? 'opacity-70 blur-[0.5px]' : 'opacity-100 blur-0'"
              >
                <table class="min-w-[780px] text-left text-xs">
                  <thead class="bg-[#f4f8fb] text-[11px] font-extrabold uppercase tracking-wide text-[#5a6b7c]">
                    <tr>
                      <th class="w-16 px-4 py-4">No.</th>
                      <th class="w-52 px-3 py-4">User Name</th>
                      <th class="w-28 px-3 py-4">Employee ID</th>
                      <th class="w-28 px-3 py-4">Referrer ID</th>
                      <th class="w-24 px-3 py-4">OS</th>
                      <th class="w-40 px-3 py-4">Downloaded At</th>
                      <th class="w-28 px-3 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#d7e2ec]">
                    <tr v-for="row in activityRows" :key="row.id" class="bg-white">
                      <td class="px-4 py-4 font-semibold text-[#17324d]">#{{ row.no }}</td>
                      <td class="px-3 py-4 font-bold text-[#17324d]">{{ row.receiverName }}</td>
                      <td class="px-3 py-4 font-semibold text-[#17324d]">{{ row.receiverEmpId }}</td>
                      <td class="px-3 py-4 font-semibold text-[#17324d]">{{ row.referrerEmpId }}</td>
                      <td class="px-3 py-4 font-semibold text-[#17324d]">{{ formatOs(row.os) }}</td>
                      <td class="px-3 py-4 font-semibold text-[#17324d]">
                        {{ formatDownloadedAt(row.downloadedAt) }}
                      </td>
                      <td class="px-3 py-4">
                        <span
                          class="rounded-full px-2 py-1 text-[11px] font-bold"
                          :class="row.status === 'Verified'
                            ? 'bg-[#e7f6ed] text-[#128041]'
                            : 'bg-[#fff7df] text-[#b77900]'"
                        >
                          {{ row.status }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="!activityRows.length" class="bg-white">
                      <td colspan="7" class="px-5 py-8 text-center text-sm font-semibold text-[#5a6b7c]">
                        No download records found.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <div class="flex flex-col gap-3 border-t border-[#d7e2ec] px-5 py-4 text-sm font-semibold text-[#17324d] sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs font-bold">{{ activitySummary }}</p>
              <div class="flex items-center gap-5">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9d8e8] bg-white transition hover:bg-[#e8f4fb] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                  :disabled="!canGoPreviousPage"
                  @click="goToPreviousPage"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <span>Page {{ pagination.page }} of {{ pagination.pageCount }}</span>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9d8e8] bg-white transition hover:bg-[#e8f4fb] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                  :disabled="!canGoNextPage"
                  @click="goToNextPage"
                >
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </section>

        <aside class="min-w-0 space-y-4">
          <section class="rounded-lg border border-[#d7e2ec] bg-white p-4 shadow-[0_1px_2px_rgba(23,50,77,0.06)]">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#f5b400] text-white">
                <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="m10 1.8 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7l5-.7L10 1.8Z" />
                </svg>
              </span>
              <h2 class="text-lg font-extrabold text-[#17324d]">Top 38 Pioneers</h2>
            </div>
            <span class="rounded-full bg-[#e8f4fb] px-4 py-2 text-sm font-semibold text-[#0067a6]">
              {{ pioneerStatusLabel }}
            </span>
          </div>

          <ol class="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
            <li
              v-for="pioneer in pioneers"
              :key="pioneer.employeeId"
              class="flex items-center gap-4 rounded-md px-3 py-3"
              :class="pioneer.qualified ? 'border border-[#c9d8e8] bg-[#f7fbff]' : ''"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold"
                :class="pioneer.rank === 1 ? 'bg-[#008bd2] text-white' : 'bg-[#edf2f7] text-[#5a6b7c]'"
              >
                {{ pioneer.rank }}
              </span>
              <div class="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-bold text-[#17324d]">{{ pioneer.name }}</p>
                  <p class="mt-0.5 text-xs font-semibold text-[#17324d]">{{ pioneer.employeeId }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-black text-[#008bd2]">{{ pioneer.refers }}</p>
                  <p class="text-[10px] font-extrabold uppercase text-[#5a6b7c]">Refers</p>
                </div>
              </div>
              <svg class="h-5 w-5 shrink-0" :class="pioneer.qualified ? 'text-[#f5b400]' : 'text-[#5a6b7c]'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                <path d="M6 6H4v2a4 4 0 0 0 4 4" />
                <path d="M18 6h2v2a4 4 0 0 1-4 4" />
                <path d="M12 13v5" />
                <path d="M9 20h6" />
              </svg>
            </li>
          </ol>
          <p v-if="!pioneers.length" class="mt-4 rounded-md bg-[#f7fbff] px-3 py-4 text-sm font-semibold text-[#5a6b7c]">
            No referral downloads recorded yet.
          </p>

          <div class="mt-4 border-t border-[#d7e2ec] pt-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-md border border-[#d7e2ec] bg-[#f7fbff] p-4 text-center">
                <p class="text-[11px] font-extrabold text-[#17324d]">Slots Filled</p>
                <p class="mt-1 text-2xl font-black text-[#008bd2]">{{ pioneerSlotsText }}</p>
              </div>
              <div class="rounded-md border border-[#d7e2ec] bg-[#f7fbff] p-4 text-center">
                <p class="text-[11px] font-extrabold text-[#17324d]">Avg Refers</p>
                <p class="mt-1 text-2xl font-black text-[#008bd2]">{{ stats.avgRefers }}</p>
              </div>
            </div>

            <button
              type="button"
              class="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#008bd2] text-sm font-semibold text-white transition hover:bg-[#0067a6]"
              @click="openWinnersDialog"
            >
              View All 38 Pioneers
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          </section>

          <section class="overflow-hidden rounded-lg border border-[#d7e2ec] bg-white shadow-[0_1px_2px_rgba(23,50,77,0.06)]">
            <img
              :src="deltaHiBannerUrl"
              alt="DeltaHi app download banner"
              class="block h-auto w-full"
            >
          </section>
        </aside>
      </div>
    </div>

    <div
      v-if="showWinnersDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#102033]/70 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-ranking-title"
      @click.self="closeWinnersDialog"
    >
      <section class="max-h-full w-full max-w-2xl overflow-hidden rounded-lg border border-[#d7e2ec] bg-white shadow-2xl">
        <header class="flex items-start justify-between gap-4 border-b border-[#d7e2ec] px-5 py-4">
          <div class="min-w-0">
            <p class="text-xs font-extrabold uppercase text-[#008bd2]">Ranking</p>
            <h2 id="winner-ranking-title" class="mt-1 text-xl font-black text-[#17324d]">
              Top 38 Pioneers
            </h2>
            <p class="mt-1 text-xs font-semibold text-[#5a6b7c]">
              {{ pioneerSlotsText }} slots filled - {{ pioneerStatusLabel }}
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[#5a6b7c] transition hover:bg-[#e8f4fb] hover:text-[#008bd2]"
            aria-label="Close winners ranking"
            @click="closeWinnersDialog"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div class="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div class="mb-4 flex flex-col gap-3 border-b border-[#d7e2ec] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <label class="w-full sm:w-44">
              <span class="mb-1 block text-[10px] font-extrabold uppercase text-[#5a6b7c]">Sort</span>
              <select
                v-model="winnerSort"
                class="h-10 w-full rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-bold text-[#17324d] outline-none transition focus:border-[#008bd2] focus:bg-white focus:ring-2 focus:ring-[#dff1fb]"
              >
                <option value="highest">Highest first</option>
                <option value="lowest">Lowest first</option>
              </select>
            </label>
            <div class="flex flex-col gap-2 sm:items-end">
              <p class="text-xs font-bold text-[#5a6b7c]">{{ winnerSummary }}</p>
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[#c9d8e8] bg-[#f7fbff] px-3 text-xs font-extrabold text-[#008bd2] hover:text-[#0067a6] transition hover:bg-[#e8f4fb] disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!sortedWinnerRows.length"
                @click="exportWinnersCsv"
              >
                Export CSV
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M5 21h14" />
                  <path d="M19 15v6H5v-6" />
                </svg>
              </button>
            </div>
          </div>

          <ol v-if="paginatedWinnerRows.length" class="space-y-2">
            <li
              v-for="pioneer in paginatedWinnerRows"
              :key="`winner-${pioneer.employeeId}`"
              class="grid grid-cols-[44px_minmax(0,1fr)_104px] items-center gap-3 rounded-md border border-[#d7e2ec] bg-[#f7fbff] px-3 py-3"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black"
                :class="pioneer.rank === 1 ? 'bg-[#008bd2] text-white' : 'bg-[#edf2f7] text-[#5a6b7c]'"
              >
                {{ pioneer.rank }}
              </span>
              <div class="min-w-0">
                <p class="truncate text-sm font-extrabold text-[#17324d]">{{ pioneer.name }}</p>
                <p class="mt-0.5 text-xs font-semibold text-[#5a6b7c]">{{ pioneer.employeeId }}</p>
              </div>
              <div class="text-right">
                <p class="text-base font-black text-[#008bd2]">{{ numberFormatter.format(pioneer.score) }}</p>
                <p class="text-[10px] font-extrabold uppercase text-[#5a6b7c]">Score</p>
                <p class="mt-0.5 text-[10px] font-bold text-[#5a6b7c]">{{ pioneer.refers }} Refers</p>
              </div>
            </li>
          </ol>

          <p v-else class="rounded-md bg-[#f7fbff] px-4 py-8 text-center text-sm font-semibold text-[#5a6b7c]">
            No pioneer ranking records yet.
          </p>
        </div>

        <footer
          v-if="sortedWinnerRows.length"
          class="flex items-center justify-between gap-4 border-t border-[#d7e2ec] px-5 py-4 text-sm font-semibold text-[#17324d]"
        >
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9d8e8] bg-white transition hover:bg-[#e8f4fb] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous winners page"
            :disabled="!canGoPreviousWinnerPage"
            @click="goToPreviousWinnerPage"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <span>Page {{ winnerPage }} of {{ winnerPageCount }}</span>

          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c9d8e8] bg-white transition hover:bg-[#e8f4fb] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next winners page"
            :disabled="!canGoNextWinnerPage"
            @click="goToNextWinnerPage"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </footer>
      </section>
    </div>
  </main>
</template>
