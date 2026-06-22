<script setup lang="ts">
import appDeltaHiLogoUrl from "~/assets/img/App_DeltaHi_Logo.png";
import deltaLogoUrl from "~/assets/img/Delta_Logo.png";
import androidTutorialStep1Url from "~/assets/img/tutorials/Android/An1.png";
import androidTutorialStep2Url from "~/assets/img/tutorials/Android/An2.png";
import androidTutorialStep3Url from "~/assets/img/tutorials/Android/An3.png";
import androidTutorialStep4Url from "~/assets/img/tutorials/Android/An4.png";
import androidTutorialStep5Url from "~/assets/img/tutorials/Android/An5.png";
import androidTutorialStep6Url from "~/assets/img/tutorials/Android/An6.png";
import iosTutorialStep1Url from "~/assets/img/tutorials/iOS/iOS+(1).png";
import iosTutorialStep2Url from "~/assets/img/tutorials/iOS/iOS+(2).png";
import iosTutorialStep3Url from "~/assets/img/tutorials/iOS/iOS+(3).png";
import iosTutorialStep4Url from "~/assets/img/tutorials/iOS/iOS+(4).png";
import iosTutorialStep5Url from "~/assets/img/tutorials/iOS/iOS+(5).png";
import iosTutorialStep6Url from "~/assets/img/tutorials/iOS/iOS+(6).png";
import type { DownloadOs, TutorialOs } from "../../../shared/schemas/referral";
import deltaHiBannerUrl from "~/assets/img/DeltaHi Banner.svg";

type TutorialStep = "download" | "choose-os" | "ios" | "android";
type AvailableLocale = "en" | "th";
type LocalizedMessage = {
  key: string;
  params?: Record<string, string | number>;
};

const route = useRoute();
const config = useRuntimeConfig();
const { locale, setLocale, t } = useI18n();
const shareId = computed(() => String(route.params.shareId || ""));
const employeeId = ref("");
const formError = ref<LocalizedMessage | null>(null);
const actionError = ref<LocalizedMessage | null>(null);
const isSubmitting = ref(false);
const isRecordingClick = ref(false);
const showDownloadDialog = ref(false);
const hasStartedDownload = ref(false);
const languageMenuOpen = ref(false);
const downloadStep = ref<TutorialStep>("download");
const employeeIdInput = ref<HTMLInputElement | null>(null);
const normalizedEmployeeId = computed(() =>
  employeeId.value.trim().toUpperCase(),
);
const downloadUrl = computed(() =>
  String(config.public.downloadUrl || "").trim(),
);
const downloadReceiverEmpId = ref("");
const isDownloadStepActive = computed(
  () => showDownloadDialog.value || hasStartedDownload.value,
);
const isSelfReferral = computed(() => {
  const referrerEmployeeId = String(
    shareResponse.value?.share?.employeeId ?? "",
  )
    .trim()
    .toUpperCase();

  return Boolean(
    downloadReceiverEmpId.value &&
      downloadReceiverEmpId.value === referrerEmployeeId,
  );
});

const languageOptions: Array<{
  code: AvailableLocale;
  label: string;
  shortLabel: string;
}> = [
  { code: "th", label: "ไทย / TH", shortLabel: "🇹🇭 TH" },
  { code: "en", label: "English / EN", shortLabel: "🇬🇧 EN" },
];

const contactTeam = [
  {
    name: "Mobile OA",
    nickname: "eTicket",
  },
];

const iosTutorialImages = [
  iosTutorialStep1Url,
  iosTutorialStep2Url,
  iosTutorialStep3Url,
  iosTutorialStep4Url,
  iosTutorialStep5Url,
  iosTutorialStep6Url,
];

const androidTutorialImages = [
  androidTutorialStep1Url,
  androidTutorialStep2Url,
  androidTutorialStep3Url,
  androidTutorialStep4Url,
  androidTutorialStep5Url,
  androidTutorialStep6Url,
];

const {
  data: shareResponse,
  pending,
  error,
} = await useFetch(() => `/api/shares/${encodeURIComponent(shareId.value)}`);

const currentLocaleCode = computed<AvailableLocale>(() =>
  locale.value === "th" ? "th" : "en",
);

const currentLanguageOption = computed(
  () =>
    languageOptions.find((option) => option.code === currentLocaleCode.value) ??
    languageOptions[1],
);

const formErrorText = computed(() =>
  formError.value ? t(formError.value.key, formError.value.params ?? {}) : "",
);

const actionErrorText = computed(() =>
  actionError.value
    ? t(actionError.value.key, actionError.value.params ?? {})
    : "",
);

watch(employeeId, () => {
  formError.value = null;
});

function getStatusCode(error: unknown) {
  if (error && typeof error === "object") {
    if ("statusCode" in error) {
      return Number(error.statusCode);
    }

    if (
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "status" in error.response
    ) {
      return Number(error.response.status);
    }
  }

  return 0;
}

function getActionErrorMessage(_error: unknown): LocalizedMessage {
  return { key: "shareApp.errors.saveReferral" };
}

function detectDeviceOs(): DownloadOs {
  if (!import.meta.client) {
    return "unknown";
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    return "android";
  }

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return "ios";
  }

  return "unknown";
}

function getDownloadOs(): DownloadOs {
  if (downloadStep.value === "ios" || downloadStep.value === "android") {
    return downloadStep.value;
  }

  return detectDeviceOs();
}

function openDownloadUrl() {
  const url = downloadUrl.value;

  if (!url) {
    actionError.value = { key: "shareApp.errors.openDownload" };
    return false;
  }

  if (!import.meta.client) {
    return false;
  }

  const downloadWindow = window.open(url, "_blank");

  if (!downloadWindow) {
    actionError.value = { key: "shareApp.errors.openDownload" };
    return false;
  }

  downloadWindow.opener = null;

  return true;
}

function closeDownloadDialog() {
  if (hasStartedDownload.value) {
    return;
  }

  showDownloadDialog.value = false;
  downloadStep.value = "download";
  actionError.value = null;
}

async function editEmployeeId() {
  showDownloadDialog.value = false;
  hasStartedDownload.value = false;
  downloadStep.value = "download";
  actionError.value = null;
  downloadReceiverEmpId.value = "";
  employeeId.value = "";
  await nextTick();
  employeeIdInput.value?.focus();
}

function chooseOs(os: TutorialOs) {
  actionError.value = null;
  downloadStep.value = os;
}

function toggleLanguageMenu() {
  languageMenuOpen.value = !languageMenuOpen.value;
}

function closeLanguageMenu() {
  languageMenuOpen.value = false;
}

function closeLanguageMenuOnFocusOut(event: FocusEvent) {
  const currentTarget = event.currentTarget;
  const nextTarget = event.relatedTarget;

  if (
    currentTarget instanceof Node &&
    nextTarget instanceof Node &&
    currentTarget.contains(nextTarget)
  ) {
    return;
  }

  closeLanguageMenu();
}

async function selectLanguage(selectedLocale: AvailableLocale) {
  if (selectedLocale !== currentLocaleCode.value) {
    await setLocale(selectedLocale);
  }

  closeLanguageMenu();
}

async function downloadApp() {
  actionError.value = null;
  isRecordingClick.value = true;

  try {
    if (!downloadReceiverEmpId.value) {
      actionError.value = { key: "shareApp.errors.enterEmployeeIdFirst" };
      return;
    }

    const downloadWindowOpened = openDownloadUrl();

    if (!downloadWindowOpened) {
      return;
    }

    hasStartedDownload.value = true;
    const detectedOs = getDownloadOs();

    if (!shareId.value) {
      actionError.value = { key: "shareApp.errors.validReferralAndEmployee" };
      return;
    }

    try {
      await $fetch("/api/downloads", {
        method: "POST",
        body: {
          employeeShareId: shareId.value,
          recieverEmpId: downloadReceiverEmpId.value,
          os: detectedOs,
        },
      });
    } catch (recordError) {
      if (![400, 404, 409].includes(getStatusCode(recordError))) {
        actionError.value = getActionErrorMessage(recordError);
        return;
      }
    }

    downloadStep.value = detectedOs === "unknown" ? "choose-os" : detectedOs;
  } catch {
    actionError.value = { key: "shareApp.errors.detectOs" };
  } finally {
    isRecordingClick.value = false;
  }
}

async function submitEmployeeId() {
  formError.value = null;
  actionError.value = null;
  isSubmitting.value = true;

  try {
    if (!normalizedEmployeeId.value) {
      formError.value = { key: "shareApp.errors.validEmployeeId" };
      return;
    }

    downloadReceiverEmpId.value = normalizedEmployeeId.value;
    downloadStep.value = "download";
    showDownloadDialog.value = true;
  } catch {
    formError.value = { key: "shareApp.errors.saveReferral" };
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen px-4 py-8">
    <section
      class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center"
    >
      <div class="delta-glow-card">
        <div class="flex items-center justify-between gap-4">
          <img :src="deltaLogoUrl" alt="Delta" class="h-auto w-36" />
          <div
            class="relative shrink-0"
            @focusout="closeLanguageMenuOnFocusOut"
            @keydown.escape.stop="closeLanguageMenu"
          >
            <span class="sr-only">{{ t("shareApp.language.change") }}</span>
            <button
              type="button"
              class="flex h-9 min-w-20 items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition hover:border-brand-600 hover:bg-brand-50 active:bg-brand-100 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              :aria-label="t('shareApp.language.change')"
              aria-haspopup="listbox"
              :aria-expanded="languageMenuOpen"
              @click="toggleLanguageMenu"
            >
              <span>{{ currentLanguageOption.shortLabel }}</span>
              <svg
                class="h-4 w-4 text-slate-500 transition-transform"
                :class="{ 'rotate-180': languageMenuOpen }"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <div
              v-if="languageMenuOpen"
              class="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
              role="listbox"
              :aria-label="t('shareApp.language.options')"
            >
              <button
                v-for="option in languageOptions"
                :key="option.code"
                type="button"
                class="flex w-full items-center justify-between px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100"
                :class="
                  option.code === currentLocaleCode
                    ? 'bg-brand-50 text-brand-700'
                    : ''
                "
                role="option"
                :aria-selected="option.code === currentLocaleCode"
                @click="selectLanguage(option.code)"
              >
                <span>{{ option.label }}</span>
              </button>
            </div>
          </div>
        </div>
        <h1 class="mt-4 text-2xl font-semibold tracking-normal text-slate-950">
          {{ t("shareApp.title") }}
        </h1>

        <div
          class="mt-6 flex items-center justify-center gap-2 text-xs font-semibold"
        >
          <div class="flex items-center gap-2 text-brand-700">
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-sm"
              >1</span
            >
            <span>{{ t("shareApp.steps.enterEmployeeId") }}</span>
          </div>
          <div
            class="h-px w-8 transition-colors"
            :class="isDownloadStepActive ? 'bg-brand-600' : 'bg-slate-300'"
          />
          <div
            class="flex items-center gap-2 transition-colors"
            :class="isDownloadStepActive ? 'text-brand-700' : 'text-slate-500'"
          >
            <span
              class="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-colors"
              :class="
                isDownloadStepActive
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-slate-300 bg-slate-100 text-slate-600'
              "
              >2</span
            >
            <span>{{ t("shareApp.steps.downloadApp") }}</span>
          </div>
        </div>

        <section class="mt-6 rounded-lg border border-sky-200 bg-sky-50/40 p-3">
          <div class="flex items-center gap-3">
            <div
              class="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
            >
              <img
                :src="appDeltaHiLogoUrl"
                alt="DeltaHi app"
                class="h-12 w-12 rounded-lg object-contain"
              />
            </div>
            <div class="min-w-0">
              <p class="text-base font-semibold text-slate-950">
                {{ t("shareApp.verifyCard.title") }}
              </p>
              <p class="mt-1 text-sm leading-6 text-slate-700">
                {{ t("shareApp.verifyCard.description") }}
              </p>
            </div>
          </div>
        </section>

        <div
          v-if="pending"
          class="mt-6 rounded-md bg-slate-100 p-4 text-sm text-slate-700"
        >
          {{ t("shareApp.status.checkingReferral") }}
        </div>

        <div
          v-else-if="error"
          class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700"
        >
          {{ t("shareApp.status.invalidReferral") }}
        </div>

        <form v-else class="mt-6 space-y-4" @submit.prevent="submitEmployeeId">
          <div
            v-if="shareResponse?.share?.employeeId"
            class="rounded-md bg-slate-50 p-3 text-sm text-slate-600"
          >
            {{
              t("shareApp.status.sharedBy", {
                employeeId: shareResponse.share.employeeId,
              })
            }}
          </div>

          <label class="block">
            <span class="text-sm font-medium text-slate-800">{{
              t("shareApp.employeeId.label")
            }}</span>
            <input
              ref="employeeIdInput"
              v-model.trim="employeeId"
              type="text"
              inputmode="text"
              autocomplete="off"
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              :placeholder="t('shareApp.employeeId.placeholder')"
            />
          </label>

          <p
            v-if="formErrorText"
            class="rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {{ formErrorText }}
          </p>

          <button
            type="submit"
            class="w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isSubmitting"
          >
            {{
              isSubmitting
                ? t("shareApp.actions.saving")
                : t("shareApp.actions.continue")
            }}
          </button>
        </form>

        <div class="mt-6 border-t border-slate-200 pt-5 text-sm">
          <div class="space-y-3">
            <div
              v-for="team in contactTeam"
              :key="team.name"
              class="rounded-md border border-slate-200 bg-white p-3"
            >
              <div class="flex min-w-0 items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"
                >
                  <svg
                    class="h-6 w-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 12a9 9 0 0 1 18 0" />
                    <path d="M3 13v3a2 2 0 0 0 2 2h1v-7H5a2 2 0 0 0-2 2Z" />
                    <path d="M21 13v3a2 2 0 0 1-2 2h-1v-7h1a2 2 0 0 1 2 2Z" />
                    <path d="M13 20h2a3 3 0 0 0 3-3" />
                  </svg>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-slate-950">
                    {{ t("shareApp.help.title") }}
                  </p>
                  <p class="mt-1 leading-6 text-slate-700">
                    {{
                      t("shareApp.help.description", {
                        team: `${team.name} - ${team.nickname}`,
                      })
                    }}
                  </p>
                </div>
              </div>
              <a
                class="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-brand-600 bg-brand-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
                :href="`https://oa.deltaww.com.cn/WebAPI/openApp/openAppNew.html?ModuleID=41`"
              >
                {{ t("shareApp.help.contactSupport") }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div
      v-if="showDownloadDialog"
      class="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-slate-950/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="delta-glow-card max-h-full w-full overflow-y-auto overscroll-contain"
        :class="downloadStep === 'ios' ? 'max-w-4xl' : 'max-w-md'"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-emerald-700">
              {{ t("shareApp.dialog.ready") }}
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-950">
              {{ t("shareApp.dialog.title") }}
            </h2>
          </div>
          <button
            v-if="!hasStartedDownload"
            type="button"
            class="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            :aria-label="t('shareApp.actions.closeDownloadPopup')"
            @click="closeDownloadDialog"
          >
            {{ t("shareApp.actions.close") }}
          </button>
        </div>

        <div v-if="downloadStep === 'download'">
          <p class="mt-3 text-sm leading-6 text-slate-600">
            {{ t("shareApp.dialog.instructions") }}
          </p>

          <div
            v-if="isSelfReferral"
            class="mt-4 border-l-4 border-amber-400 bg-amber-100 px-4 py-3 text-sm leading-6 text-slate-900"
            role="alert"
          >
            <p class="font-semibold">
              {{ t("shareApp.selfReferral.title") }}
            </p>
            <p>{{ t("shareApp.selfReferral.description") }}</p>
          </div>

          <button
            v-if="isSelfReferral"
            type="button"
            class="mt-6 w-full rounded-md border-2 border-brand-600 bg-white px-4 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
            @click="editEmployeeId"
          >
            {{ t("shareApp.selfReferral.edit") }}
          </button>

          <button
            type="button"
            class="w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :class="isSelfReferral ? 'mt-3' : 'mt-6'"
            :disabled="isRecordingClick"
            @click="downloadApp"
          >
            {{
              isRecordingClick
                ? t("shareApp.actions.checkingDevice")
                : t("shareApp.actions.downloadApp")
            }}
          </button>

          <div class="mt-5 border-t border-slate-200 pt-5 text-center">
            <p class="text-sm text-slate-600">
              {{ t("shareApp.dialog.cannotDownload") }}
            </p>
            <button
              type="button"
              class="mt-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              @click="downloadStep = 'choose-os'"
            >
              {{ t("shareApp.actions.viewTutorial") }}
            </button>
          </div>
        </div>

        <div v-else-if="downloadStep === 'choose-os'">
          <p class="mt-5 text-sm font-medium text-brand-700">
            {{ t("shareApp.tutorial.label") }}
          </p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-950">
            {{ t("shareApp.tutorial.choosePhone") }}
          </h2>
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
            {{ t("shareApp.actions.backToDownload") }}
          </button>
        </div>

        <div v-else>
          <p class="mt-5 text-sm font-medium text-brand-700">
            {{
              downloadStep === "ios"
                ? t("shareApp.tutorial.iosLabel")
                : t("shareApp.tutorial.androidLabel")
            }}
          </p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-950">
            {{
              downloadStep === "ios"
                ? t("shareApp.tutorial.installIos")
                : t("shareApp.tutorial.installAndroid")
            }}
          </h2>

          <div
            v-if="downloadStep === 'ios'"
            class="mt-5 space-y-4 overscroll-contain"
          >
            <div
              v-for="(imageUrl, imageIndex) in iosTutorialImages"
              :key="imageUrl"
              class="overflow-hidden rounded-md border border-slate-200 bg-slate-50"
            >
              <img
                :src="imageUrl"
                :alt="
                  t('shareApp.tutorial.iosImageAlt', { step: imageIndex + 1 })
                "
                class="mx-auto w-full object-contain"
              />
            </div>
          </div>

          <div v-else class="mt-5 space-y-4 overscroll-contain">
            <div
              v-for="(imageUrl, imageIndex) in androidTutorialImages"
              :key="imageUrl"
              class="overflow-hidden rounded-md border border-slate-200 bg-slate-50"
            >
              <img
                :src="imageUrl"
                :alt="
                  t('shareApp.tutorial.androidImageAlt', {
                    step: imageIndex + 1,
                  })
                "
                class="mx-auto w-full object-contain"
              />
            </div>
          </div>

          <button
            type="button"
            class="mt-4 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            @click="downloadStep = 'download'"
          >
            {{ t("shareApp.actions.backToDownload") }}
          </button>
        </div>

        <p
          v-if="actionErrorText"
          class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {{ actionErrorText }}
        </p>
      </div>
    </div>
  </main>
</template>
