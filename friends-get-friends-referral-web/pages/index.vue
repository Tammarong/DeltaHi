<script setup lang="ts">
import QRCode from 'qrcode'

type EmployeeShare = {
  id: string
  userId: string
  employeeId: string
  shareUrl: string
  createdAt: string
  updatedAt: string
}

type GetEmployeeShareResponse = {
  share: EmployeeShare
}

const route = useRoute()
const formError = ref('')
const isLoadingShare = ref(false)
const shareResult = ref<EmployeeShare | null>(null)
const qrCodeDataUrl = ref('')
const employeeShareIdFromQuery = computed(() => String(route.query.employeeShareId || '').trim())

function getStatusMessage(error: unknown) {
  if (error && typeof error === 'object') {
    if ('statusMessage' in error) {
      return String(error.statusMessage)
    }

    if ('data' in error && error.data && typeof error.data === 'object' && 'statusMessage' in error.data) {
      return String(error.data.statusMessage)
    }
  }

  return 'Referral QR is unavailable.'
}

async function renderShareQr(share: EmployeeShare) {
  shareResult.value = share
  qrCodeDataUrl.value = await QRCode.toDataURL(share.shareUrl, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256
  })
}

async function loadShareQrById(employeeShareId: string) {
  formError.value = ''
  isLoadingShare.value = true

  try {
    const { share } = await $fetch<GetEmployeeShareResponse>(
      `/api/shares/${encodeURIComponent(employeeShareId)}`
    )

    await renderShareQr(share)
  } catch (error) {
    formError.value = getStatusMessage(error)
    shareResult.value = null
    qrCodeDataUrl.value = ''
  } finally {
    isLoadingShare.value = false
  }
}

async function copyShareUrl() {
  if (!shareResult.value?.shareUrl) {
    return
  }

  try {
    await navigator.clipboard.writeText(shareResult.value.shareUrl)
  } catch {
    // Keep the QR page usable even if clipboard access is blocked.
  }
}

onMounted(() => {
  if (employeeShareIdFromQuery.value) {
    void loadShareQrById(employeeShareIdFromQuery.value)
  } else {
    formError.value = 'Referral QR is unavailable.'
  }
})
</script>

<template>
  <main class="min-h-screen px-4 py-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium text-brand-700">DeltaHi referral</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          Referral QR
        </h1>

        <div
          v-if="isLoadingShare"
          class="mt-6 rounded-md bg-slate-100 p-4 text-sm text-slate-700"
        >
          Loading referral QR...
        </div>

        <p v-if="formError" class="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {{ formError }}
        </p>

        <div v-if="shareResult" class="mt-6 border-t border-slate-200 pt-6">
          <div class="rounded-md bg-slate-50 p-4 text-center">
            <img
              v-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="Referral QR code"
              class="mx-auto h-64 w-64"
            >
          </div>

          <dl class="mt-4 space-y-3 text-sm">
            <div>
              <dt class="font-medium text-slate-800">EmployeeShare ID</dt>
              <dd class="mt-1 break-all text-slate-600">{{ shareResult.id }}</dd>
            </div>
            <div>
              <dt class="font-medium text-slate-800">Referral link</dt>
              <dd class="mt-1 break-all text-slate-600">{{ shareResult.shareUrl }}</dd>
            </div>
          </dl>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-brand-600 hover:bg-brand-50"
              @click="copyShareUrl"
            >
              Copy Link
            </button>
            <a
              :href="shareResult.shareUrl"
              class="rounded-md bg-brand-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Open Link
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
