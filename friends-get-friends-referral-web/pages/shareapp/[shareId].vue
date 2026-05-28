<script setup lang="ts">
import type { TutorialOs } from '../../shared/schemas/referral'

type TutorialStep = 'download' | 'choose-os' | 'ios' | 'android'

const route = useRoute()
const config = useRuntimeConfig()
const shareId = computed(() => String(route.params.shareId || ''))
const employeeId = ref('')
const formError = ref('')
const actionError = ref('')
const isSubmitting = ref(false)
const isRecordingClick = ref(false)
const showDownloadDialog = ref(false)
const downloadStep = ref<TutorialStep>('download')
const employeeLookupDelayMs = 400
const normalizedEmployeeId = computed(() => employeeId.value.trim().toUpperCase())
const receiverEmployee = ref<EmployeeLookupResponse['employee']>(null)
const receiverLookupStatus = ref<'idle' | 'checking' | 'found' | 'not-found' | 'error'>('idle')
const lastLookedUpEmployeeId = ref('')
const downloadReceiverEmpId = ref('')
const downloadReceiverEmployee = ref<EmployeeLookupResponse['employee']>(null)
const downloadReceiverLookupStatus = ref<'found' | 'not-found' | 'error'>('not-found')
let employeeLookupTimeout: ReturnType<typeof setTimeout> | undefined

type EmployeeLookupResponse = {
  employee: null | {
    empid: string
    name: string | null
    surname: string | null
    displayName: string
  }
}

const {
  data: shareResponse,
  pending,
  error
} = await useFetch(() => `/api/shares/${encodeURIComponent(shareId.value)}`)

const downloadUrl = computed(() => {
  if (downloadStep.value === 'android') {
    return config.public.androidDownloadUrl
  }

  return config.public.iosDownloadUrl
})

function resetEmployeeLookup() {
  receiverEmployee.value = null
  receiverLookupStatus.value = 'idle'
  lastLookedUpEmployeeId.value = ''
}

async function lookupEmployeeById(employeeIdToLookup: string) {
  if (!employeeIdToLookup) {
    resetEmployeeLookup()
    return null
  }

  receiverLookupStatus.value = 'checking'

  try {
    const { employee } = await $fetch<EmployeeLookupResponse>(
      `/api/employees/${encodeURIComponent(employeeIdToLookup)}`
    )

    if (normalizedEmployeeId.value !== employeeIdToLookup) {
      return receiverEmployee.value
    }

    receiverEmployee.value = employee
    receiverLookupStatus.value = employee ? 'found' : 'not-found'
    lastLookedUpEmployeeId.value = employeeIdToLookup

    return employee
  } catch {
    if (normalizedEmployeeId.value === employeeIdToLookup) {
      receiverEmployee.value = null
      receiverLookupStatus.value = 'error'
      lastLookedUpEmployeeId.value = employeeIdToLookup
    }

    return null
  }
}

async function getCurrentEmployeeLookup() {
  if (!normalizedEmployeeId.value) {
    return null
  }

  if (lastLookedUpEmployeeId.value === normalizedEmployeeId.value) {
    return receiverEmployee.value
  }

  if (employeeLookupTimeout) {
    clearTimeout(employeeLookupTimeout)
  }

  return await lookupEmployeeById(normalizedEmployeeId.value)
}

watch(employeeId, () => {
  formError.value = ''

  if (employeeLookupTimeout) {
    clearTimeout(employeeLookupTimeout)
  }

  const employeeIdToLookup = normalizedEmployeeId.value

  if (!employeeIdToLookup) {
    resetEmployeeLookup()
    return
  }

  receiverEmployee.value = null
  receiverLookupStatus.value = 'checking'
  lastLookedUpEmployeeId.value = ''

  employeeLookupTimeout = setTimeout(() => {
    void lookupEmployeeById(employeeIdToLookup)
  }, employeeLookupDelayMs)
})

onBeforeUnmount(() => {
  if (employeeLookupTimeout) {
    clearTimeout(employeeLookupTimeout)
  }
})

function getStatusCode(error: unknown) {
  if (error && typeof error === 'object') {
    if ('statusCode' in error) {
      return Number(error.statusCode)
    }

    if ('response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
      return Number(error.response.status)
    }
  }

  return 0
}

function getStatusMessage(error: unknown) {
  if (error && typeof error === 'object') {
    if ('statusMessage' in error) {
      return String(error.statusMessage)
    }

    if ('data' in error && error.data && typeof error.data === 'object' && 'statusMessage' in error.data) {
      return String(error.data.statusMessage)
    }
  }

  return 'Unable to save your referral. Please try again.'
}

function closeDownloadDialog() {
  showDownloadDialog.value = false
  downloadStep.value = 'download'
  actionError.value = ''
}

function chooseOs(os: TutorialOs) {
  actionError.value = ''
  downloadStep.value = os
}

async function downloadApp() {
  actionError.value = ''
  isRecordingClick.value = true

  try {
    if (!downloadReceiverEmpId.value) {
      actionError.value = 'Enter your employee ID first.'
      return
    }

    if (downloadReceiverEmployee.value) {
      if (!shareId.value) {
        actionError.value = 'Open a valid referral link and enter your employee ID first.'
        return
      }

      try {
        await $fetch('/api/downloads', {
          method: 'POST',
          body: {
            employeeShareId: shareId.value,
            recieverEmpId: downloadReceiverEmpId.value
          }
        })
      } catch (recordError) {
        if (![400, 404, 409].includes(getStatusCode(recordError))) {
          actionError.value = getStatusMessage(recordError)
          return
        }
      }
    }

    window.location.href = downloadUrl.value
  } catch {
    actionError.value = 'Unable to open the download link. Please try again.'
  } finally {
    isRecordingClick.value = false
  }
}

async function submitEmployeeId() {
  formError.value = ''
  actionError.value = ''
  isSubmitting.value = true

  try {
    if (!normalizedEmployeeId.value) {
      formError.value = 'Enter a valid employee ID.'
      return
    }

    const employee = await getCurrentEmployeeLookup()

    downloadReceiverEmpId.value = normalizedEmployeeId.value
    downloadReceiverEmployee.value = employee
    downloadReceiverLookupStatus.value = receiverLookupStatus.value === 'error'
      ? 'error'
      : employee
        ? 'found'
        : 'not-found'
    downloadStep.value = 'download'
    showDownloadDialog.value = true
  } catch (submitError) {
    formError.value =
      submitError && typeof submitError === 'object' && 'statusMessage' in submitError
        ? String(submitError.statusMessage)
        : 'Unable to save your referral. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen px-4 py-8">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
      <div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p class="text-sm font-medium text-brand-700">DeltaHi referral</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
          Enter your employee ID
        </h1>

        <div v-if="pending" class="mt-6 rounded-md bg-slate-100 p-4 text-sm text-slate-700">
          Checking referral link...
        </div>

        <div v-else-if="error" class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
          Referral link is invalid or expired.
        </div>

        <form v-else class="mt-6 space-y-4" @submit.prevent="submitEmployeeId">
          <div v-if="shareResponse?.share?.employeeId" class="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            Shared by employee {{ shareResponse.share.employeeId }}
          </div>

          <label class="block">
            <span class="text-sm font-medium text-slate-800">Employee ID</span>
            <input
              v-model="employeeId"
              type="text"
              inputmode="text"
              autocomplete="off"
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              placeholder="Example: EMP006"
            >
          </label>

          <div v-if="receiverLookupStatus === 'checking'" class="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
            Checking employee ID...
          </div>
          <div v-else-if="receiverLookupStatus === 'found' && receiverEmployee" class="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
            Employee verified: {{ receiverEmployee.displayName }}
          </div>
          <div v-else-if="receiverLookupStatus === 'not-found'" class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Employee ID {{ normalizedEmployeeId }} was not found. You can still continue to download.
          </div>
          <div v-else-if="receiverLookupStatus === 'error'" class="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Unable to verify this employee ID right now. You can still continue to download.
          </div>

          <p v-if="formError" class="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {{ formError }}
          </p>

          <button
            type="submit"
            class="w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Saving...' : 'Continue' }}
          </button>
        </form>
      </div>
    </section>

    <div
      v-if="showDownloadDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="max-h-full w-full max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-700">Ready to download</p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-950">
              Download the DeltaHi app
            </h2>
          </div>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close download popup"
            @click="closeDownloadDialog"
          >
            Close
          </button>
        </div>

        <div v-if="downloadStep === 'download'">
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Tap Download App to save your referral and install the app.
          </p>
          <div
            v-if="downloadReceiverLookupStatus === 'found' && downloadReceiverEmployee"
            class="mt-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Employee verified: {{ downloadReceiverEmployee.displayName }}
          </div>
          <div
            v-else-if="downloadReceiverLookupStatus === 'error'"
            class="mt-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800"
          >
            Unable to verify this employee ID right now. You can still download the app.
          </div>
          <div
            v-else
            class="mt-5 rounded-md bg-amber-50 p-3 text-sm text-amber-800"
          >
            Employee ID {{ downloadReceiverEmpId }} was not found. You can still download the app, but this referral will not be saved.
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isRecordingClick"
            @click="downloadApp"
          >
            {{ isRecordingClick ? 'Opening...' : 'Download App' }}
          </button>

          <div class="mt-5 border-t border-slate-200 pt-5 text-center">
            <p class="text-sm text-slate-600">Can't download the app?</p>
            <button
              type="button"
              class="mt-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              @click="downloadStep = 'choose-os'"
            >
              View Tutorial
            </button>
          </div>
        </div>

        <div v-else-if="downloadStep === 'choose-os'">
          <p class="mt-5 text-sm font-medium text-brand-700">Tutorial</p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-950">Choose your phone</h2>
          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="rounded-md border border-slate-300 px-4 py-4 text-sm font-semibold transition hover:border-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              @click="chooseOs('ios')"
            >
              iOS
            </button>
            <button
              type="button"
              class="rounded-md border border-slate-300 px-4 py-4 text-sm font-semibold transition hover:border-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              @click="chooseOs('android')"
            >
              Android
            </button>
          </div>
          <button
            type="button"
            class="mt-5 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            @click="downloadStep = 'download'"
          >
            Back to Download
          </button>
        </div>

        <div v-else>
          <p class="mt-5 text-sm font-medium text-brand-700">
            {{ downloadStep === 'ios' ? 'iOS tutorial' : 'Android tutorial' }}
          </p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-950">
            {{ downloadStep === 'ios' ? 'Install on iPhone' : 'Install on Android' }}
          </h2>

          <ol class="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li v-if="downloadStep === 'ios'">1. Tap Download App to open the App Store.</li>
            <li v-if="downloadStep === 'ios'">2. Tap Get, then confirm with Face ID, Touch ID, or passcode.</li>
            <li v-if="downloadStep === 'ios'">3. Open DeltaHi and complete your first login.</li>
            <li v-if="downloadStep === 'android'">1. Tap Download App to open Google Play.</li>
            <li v-if="downloadStep === 'android'">2. Tap Install and wait for the download to finish.</li>
            <li v-if="downloadStep === 'android'">3. Open DeltaHi and complete your first login.</li>
          </ol>

          <button
            type="button"
            class="mt-6 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isRecordingClick"
            @click="downloadApp"
          >
            {{ isRecordingClick ? 'Opening...' : 'Download App' }}
          </button>
          <button
            type="button"
            class="mt-4 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            @click="downloadStep = 'download'"
          >
            Back to Download
          </button>
        </div>

        <p v-if="actionError" class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {{ actionError }}
        </p>
      </div>
    </div>
  </main>
</template>
