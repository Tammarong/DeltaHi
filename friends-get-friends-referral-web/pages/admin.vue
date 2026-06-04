<script setup lang="ts">
type DashboardDownload = {
  id: string
  no: number
  receiverName: string
  receiverEmpId: string
  referrerName: string
  referrerEmpId: string
  os: string
  downloadedAt: string
  status: string
}

type DashboardPioneer = {
  rank: number
  name: string
  employeeId: string
  refers: number
  qualified?: boolean
}

type AdminDashboardResponse = {
  stats: {
    totalDownloads: number
    newUsers: number
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
}

const navItems = ['Dashboard', 'Logs', 'Downloads', 'Users']
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10
const numberFormatter = new Intl.NumberFormat('en-US')
const downloadedAtFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok'
})

const {
  data: dashboard,
  pending,
  error,
  refresh
} = await useFetch<AdminDashboardResponse>('/api/admin/dashboard', {
  query: computed(() => ({
    page: currentPage.value,
    pageSize
  }))
})

const stats = computed(() => dashboard.value?.stats ?? {
  totalDownloads: 0,
  newUsers: 0,
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
      label: 'Total Downloads',
      value: numberFormatter.format(stats.value.totalDownloads),
      helper: 'Recorded app download clicks',
      trend: 'Live',
      tone: 'green',
      icon: 'download'
    },
    {
      label: 'New Users',
      value: numberFormatter.format(stats.value.newUsers),
      helper: 'Unique receiver employee IDs',
      trend: 'Live',
      tone: 'blue',
      icon: 'user'
    },
    {
      label: 'First 38 Users',
      value: numberFormatter.format(stats.value.first38Users),
      helper: `/ ${stats.value.pioneerSlots}`,
      trend: `${first38Progress.value}%`,
      tone: 'amber',
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
const filteredActivityRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return activityRows.value
  }

  return activityRows.value.filter((row) =>
    [
      row.receiverName,
      row.receiverEmpId,
      row.referrerName,
      row.referrerEmpId,
      row.os
    ].some((value) => value.toLowerCase().includes(query))
  )
})
const pioneers = computed(() => dashboard.value?.topPioneers ?? [])
const pioneerSlotsText = computed(() =>
  `${numberFormatter.format(stats.value.first38Users)}/${numberFormatter.format(stats.value.pioneerSlots)}`
)
const pioneerStatusLabel = computed(() =>
  stats.value.first38Users >= stats.value.pioneerSlots ? 'Qualified' : 'In Progress'
)
const activitySummary = computed(() => {
  const visibleCount = filteredActivityRows.value.length
  const totalCount = pagination.value.total

  if (!totalCount) {
    return 'Showing 0 downloads'
  }

  if (searchQuery.value.trim()) {
    return `Showing ${visibleCount} matching downloads on this page`
  }

  const start = ((pagination.value.page - 1) * pagination.value.pageSize) + 1
  const end = start + visibleCount - 1

  return `Showing ${start}-${end} of ${numberFormatter.format(totalCount)} downloads`
})
const canGoPreviousPage = computed(() => pagination.value.page > 1 && !pending.value)
const canGoNextPage = computed(() => pagination.value.page < pagination.value.pageCount && !pending.value)

watch(searchQuery, () => {
  currentPage.value = 1
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

useHead({
  title: 'Admin Dashboard | Friends Get Friends'
})
</script>

<template>
  <main class="min-h-screen overflow-x-hidden bg-[#f6f8f5] text-[#202622]">
    <header class="border-b border-[#cfd8cc] bg-[#f6f8f5]/95">
      <div class="mx-auto flex min-h-[56px] w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div class="flex min-w-0 items-center gap-4">
          <p class="text-base font-extrabold tracking-normal text-[#075f19]">
            Friends Get Friends
          </p>
          <div class="hidden h-6 w-px bg-[#c7d1c4] sm:block" />
          <h1 class="text-lg font-bold tracking-normal text-[#202622]">
            Dashboard Overview
          </h1>
        </div>

        <nav class="flex min-w-0 items-center gap-2 overflow-x-auto text-sm font-medium" aria-label="Admin navigation">
          <button
            v-for="item in navItems"
            :key="item"
            type="button"
            class="h-8 shrink-0 rounded-md px-4 text-sm transition"
            :class="item === 'Dashboard'
              ? 'bg-[#075f19] text-white shadow-sm'
              : 'text-[#202622] hover:bg-white hover:text-[#075f19]'"
          >
            {{ item }}
          </button>
        </nav>
      </div>
    </header>

    <div class="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:py-6">
      <section class="grid gap-4 md:grid-cols-3">
        <article
          v-for="card in statCards"
          :key="card.label"
          class="relative min-h-[132px] rounded-lg border border-[#cfdccf] bg-white p-4 shadow-[0_1px_2px_rgba(24,45,26,0.04)]"
        >
          <div
            v-if="card.label === 'First 38 Users' && first38Progress >= 100"
            class="absolute right-0 top-0 rounded-bl-sm rounded-tr-lg bg-[#075f19] px-3 py-1 text-[9px] font-extrabold uppercase text-white"
          >
            Goal Reached
          </div>

          <div class="flex items-start justify-between gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
              :class="{
                'bg-[#e8f7e9] text-[#075f19]': card.tone === 'green',
                'bg-[#eaf5ff] text-[#0072bc]': card.tone === 'blue',
                'bg-[#f7eee7] text-[#a35b09]': card.tone === 'amber'
              }"
            >
              <svg v-if="card.icon === 'download'" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
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

            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="card.tone === 'blue' ? 'bg-[#e2f2ff] text-[#0072bc]' : 'bg-[#e3f8e4] text-[#075f19]'"
            >
              {{ card.trend }}
            </span>
          </div>

          <div class="mt-3">
            <p class="text-[11px] font-extrabold leading-4 text-[#58625b]">{{ card.label }}</p>
            <p class="mt-1 text-[28px] font-black leading-8 tracking-normal text-[#202622]">
              {{ card.value }}
              <span v-if="card.label === 'First 38 Users'" class="text-base font-semibold text-[#202622]">
                {{ card.helper }}
              </span>
            </p>
            <p v-if="card.label !== 'First 38 Users'" class="mt-1 text-[11px] font-semibold leading-4 text-[#202622]">
              {{ card.helper }}
            </p>
            <div v-else class="mt-3 h-2 rounded-full bg-[#e5eee5]">
              <div class="h-full rounded-full bg-[#075f19]" :style="{ width: `${first38Progress}%` }" />
            </div>
          </div>
        </article>
      </section>

      <div class="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section class="min-w-0 space-y-4">
          <section class="rounded-lg border border-[#cfdccf] bg-white p-3 shadow-[0_1px_2px_rgba(24,45,26,0.04)]">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label class="relative min-w-0 flex-1">
                <span class="sr-only">Search users</span>
                <svg class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4d5a52]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  v-model="searchQuery"
                  type="search"
                  placeholder="Search by name, ID, or code..."
                  class="h-10 w-full rounded-md border border-[#c6d2c8] bg-[#f8faf9] pl-10 pr-3 text-xs font-medium text-[#202622] outline-none transition placeholder:text-[#60706a] focus:border-[#075f19] focus:bg-white focus:ring-2 focus:ring-[#dbf4dc]"
                >
              </label>

              <div class="flex shrink-0 flex-wrap items-center gap-2 lg:flex-nowrap">
                <button
                  type="button"
                  class="inline-flex h-10 w-[98px] items-center justify-center gap-2 rounded-md border border-[#c6d2c8] bg-[#f8faf9] px-2 text-xs font-extrabold text-[#075f19] transition hover:bg-[#eaf7eb]"
                  @click="refresh()"
                >
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 12a9 9 0 0 1-15.2 6.5" />
                    <path d="M3 12A9 9 0 0 1 18.2 5.5" />
                    <path d="M18 2v4h-4" />
                    <path d="M6 22v-4h4" />
                  </svg>
                  Refresh
                </button>
                <button
                  type="button"
                  class="h-10 w-[72px] px-1 text-[10px] font-bold text-[#5e625f] underline underline-offset-2 transition hover:text-[#075f19]"
                  @click="searchQuery = ''"
                >
                  Reset
                </button>
              </div>
            </div>
          </section>

          <section class="min-w-0 overflow-hidden rounded-lg border border-[#cfdccf] bg-white shadow-[0_1px_2px_rgba(24,45,26,0.04)]">
            <div class="flex items-center justify-between gap-4 border-b border-[#d1dcd0] px-5 py-5">
              <h2 class="text-lg font-extrabold text-[#202622]">Recent Activity</h2>
              <button type="button" class="inline-flex items-center gap-1 text-sm font-semibold text-[#075f19] transition hover:text-[#053f12]">
                Export CSV
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 3v12" />
                  <path d="m8 11 4 4 4-4" />
                  <path d="M5 21h14" />
                  <path d="M19 15v6H5v-6" />
                </svg>
              </button>
            </div>

            <div v-if="pending" class="px-5 py-8 text-sm font-semibold text-[#4b554f]">
              Loading dashboard records...
            </div>

            <div v-else-if="error" class="px-5 py-8 text-sm font-semibold text-red-700">
              Unable to load dashboard records.
            </div>

            <div v-else class="overflow-x-auto">
              <table class="min-w-[780px] text-left text-xs">
                <thead class="bg-[#f7f9f8] text-[11px] font-extrabold uppercase tracking-wide text-[#4b554f]">
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
                <tbody class="divide-y divide-[#d6dfd4]">
                  <tr v-for="row in filteredActivityRows" :key="row.id" class="bg-white">
                    <td class="px-4 py-4 font-semibold text-[#202622]">#{{ row.no }}</td>
                    <td class="px-3 py-4 font-bold text-[#202622]">{{ row.receiverName }}</td>
                    <td class="px-3 py-4 font-semibold text-[#202622]">{{ row.receiverEmpId }}</td>
                    <td class="px-3 py-4 font-semibold text-[#202622]">{{ row.referrerEmpId }}</td>
                    <td class="px-3 py-4 font-semibold text-[#202622]">{{ formatOs(row.os) }}</td>
                    <td class="px-3 py-4 font-semibold text-[#202622]">
                      {{ formatDownloadedAt(row.downloadedAt) }}
                    </td>
                    <td class="px-3 py-4">
                      <span
                        class="rounded-full px-2 py-1 text-[11px] font-bold"
                        :class="row.status === 'Downloaded'
                          ? 'bg-[#e7f8e7] text-[#075f19]'
                          : 'bg-[#e8e9e8] text-[#515a53]'"
                      >
                        {{ row.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!filteredActivityRows.length" class="bg-white">
                    <td colspan="7" class="px-5 py-8 text-center text-sm font-semibold text-[#4b554f]">
                      No download records found.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="flex flex-col gap-3 border-t border-[#d6dfd4] px-5 py-4 text-sm font-semibold text-[#202622] sm:flex-row sm:items-center sm:justify-between">
              <p class="text-xs font-bold">{{ activitySummary }}</p>
              <div class="flex items-center gap-5">
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c6d2c8] bg-white transition hover:bg-[#eef7ef] disabled:cursor-not-allowed disabled:opacity-40"
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
                  class="flex h-10 w-10 items-center justify-center rounded-md border border-[#c6d2c8] bg-white transition hover:bg-[#eef7ef] disabled:cursor-not-allowed disabled:opacity-40"
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
          <section class="rounded-lg border border-[#cfdccf] bg-white p-4 shadow-[0_1px_2px_rgba(24,45,26,0.04)]">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#9a5b08] text-white">
                <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="m10 1.8 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L2.8 7l5-.7L10 1.8Z" />
                </svg>
              </span>
              <h2 class="text-lg font-extrabold text-[#202622]">Top 38 Pioneers</h2>
            </div>
            <span class="rounded-full bg-[#ffe2c9] px-4 py-2 text-sm font-semibold text-[#4c2500]">
              {{ pioneerStatusLabel }}
            </span>
          </div>

          <ol class="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
            <li
              v-for="pioneer in pioneers"
              :key="pioneer.employeeId"
              class="flex items-center gap-4 rounded-md px-3 py-3"
              :class="pioneer.qualified ? 'border border-[#cfdccf] bg-[#f8faf9]' : ''"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-extrabold"
                :class="pioneer.rank === 1 ? 'bg-[#dcf8de] text-[#075f19]' : 'bg-[#e8ebea] text-[#4f5752]'"
              >
                {{ pioneer.rank }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-bold text-[#202622]">{{ pioneer.name }}</p>
                <p class="text-xs font-semibold text-[#202622]">{{ pioneer.employeeId }} - {{ pioneer.refers }} Refers</p>
              </div>
              <svg class="h-5 w-5 shrink-0" :class="pioneer.qualified ? 'text-[#a35b09]' : 'text-[#637069]'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
                <path d="M6 6H4v2a4 4 0 0 0 4 4" />
                <path d="M18 6h2v2a4 4 0 0 1-4 4" />
                <path d="M12 13v5" />
                <path d="M9 20h6" />
              </svg>
            </li>
          </ol>
          <p v-if="!pioneers.length" class="mt-4 rounded-md bg-[#f8faf9] px-3 py-4 text-sm font-semibold text-[#4b554f]">
            No referral downloads recorded yet.
          </p>

          <div class="mt-4 border-t border-[#d6dfd4] pt-4">
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-md border border-[#dbe6dc] bg-[#f5faf6] p-4 text-center">
                <p class="text-[11px] font-extrabold text-[#202622]">Slots Filled</p>
                <p class="mt-1 text-2xl font-black text-[#075f19]">{{ pioneerSlotsText }}</p>
              </div>
              <div class="rounded-md border border-[#dbe6e8] bg-[#f2f8fc] p-4 text-center">
                <p class="text-[11px] font-extrabold text-[#202622]">Avg Refers</p>
                <p class="mt-1 text-2xl font-black text-[#0072bc]">{{ stats.avgRefers }}</p>
              </div>
            </div>

            <button type="button" class="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#e2e4e3] text-sm font-semibold text-[#202622] transition hover:bg-[#d6dad8]">
              View All 38 Winners
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </div>
          </section>

          <section class="campaign-visual overflow-hidden rounded-lg border border-[#cfdccf] p-5 text-white shadow-[0_1px_2px_rgba(24,45,26,0.04)]">
            <div class="relative z-10 mt-20">
              <h2 class="text-lg font-extrabold">Campaign Performance</h2>
              <p class="mt-2 text-sm font-semibold leading-5">
                Your referral campaign is performing in the top 5% of all active initiatives this quarter.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.campaign-visual {
  min-height: 180px;
  position: relative;
  background:
    radial-gradient(circle at 52% 56%, rgb(20 160 44 / 95%) 0 8%, transparent 9%),
    repeating-conic-gradient(from 8deg at 50% 50%, rgb(220 255 221 / 70%) 0deg 4deg, rgb(4 124 22 / 90%) 4deg 10deg, rgb(0 76 14 / 95%) 10deg 15deg),
    radial-gradient(circle at center, #28aa33 0%, #086b18 48%, #064c13 100%);
}

.campaign-visual::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 48% 48%, transparent 0 28%, rgb(255 255 255 / 34%) 29%, transparent 30%),
    linear-gradient(to top, rgb(0 34 7 / 72%), transparent 62%);
  mix-blend-mode: screen;
}

.campaign-visual::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 32 7 / 72%) 0%, transparent 62%);
}
</style>
