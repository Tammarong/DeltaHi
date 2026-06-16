<script setup lang="ts">
import type { DownloadOs, TutorialOs } from "../../shared/schemas/referral";

type TutorialStep = "download" | "choose-os" | "ios" | "android";

const route = useRoute();
const config = useRuntimeConfig();
const step = ref<TutorialStep>("download");
const actionError = ref("");
const isRecordingClick = ref(false);
const employeeShareId = computed(() =>
  String(route.query.employeeShareId || "").trim(),
);
const recieverEmpId = computed(() =>
  String(route.query.recieverEmpId || "").trim(),
);

const downloadUrl = computed(() =>
  String(config.public.downloadUrl || "").trim(),
);

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

function getStatusMessage(error: unknown) {
  if (error && typeof error === "object") {
    if ("statusMessage" in error) {
      return String(error.statusMessage);
    }

    if (
      "data" in error &&
      error.data &&
      typeof error.data === "object" &&
      "statusMessage" in error.data
    ) {
      return String(error.data.statusMessage);
    }
  }

  return "Unable to save your referral. Please try again.";
}

async function downloadApp() {
  actionError.value = "";
  isRecordingClick.value = true;

  try {
    if (!recieverEmpId.value) {
      actionError.value =
        "Open a valid referral link and enter your employee ID first.";
      return;
    }

    const detectedOs =
      step.value === "ios" || step.value === "android"
        ? step.value
        : detectDeviceOs();

    if (!employeeShareId.value) {
      actionError.value =
        "Open a valid referral link and enter your employee ID first.";
      return;
    }

    try {
      await $fetch("/api/downloads", {
        method: "POST",
        body: {
          employeeShareId: employeeShareId.value,
          recieverEmpId: recieverEmpId.value,
          os: detectedOs,
        },
      });
    } catch (recordError) {
      if (![400, 404, 409].includes(getStatusCode(recordError))) {
        actionError.value = getStatusMessage(recordError);
        return;
      }
    }

    const url = downloadUrl.value;

    if (!url) {
      actionError.value = "Download link is not configured.";
      return;
    }

    if (import.meta.client) {
      window.location.href = url;
    }
  } catch {
    actionError.value = "Unable to open the download link. Please try again.";
  } finally {
    isRecordingClick.value = false;
  }
}

async function chooseOs(os: TutorialOs) {
  actionError.value = "";
  step.value = os;
}
</script>

<template>
  <main class="min-h-screen px-4 py-8">
    <section
      class="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center"
    >
      <div class="delta-glow-card">
        <div v-if="step === 'download'">
          <p class="text-sm font-medium text-emerald-700">Ready to download</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">
            Download the DeltaHi app
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Tap Download App to save your referral and install the app.
          </p>
          <div
            v-if="recieverEmpId"
            class="mt-5 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Employee ID {{ recieverEmpId }} is ready to be recorded.
          </div>

          <button
            type="button"
            class="mt-6 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isRecordingClick"
            @click="downloadApp"
          >
            {{ isRecordingClick ? "Opening..." : "Download App" }}
          </button>

          <div class="mt-5 border-t border-slate-200 pt-5 text-center">
            <p class="text-sm text-slate-600">Can't download the app?</p>
            <button
              type="button"
              class="mt-2 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              @click="step = 'choose-os'"
            >
              View Tutorial
            </button>
          </div>
        </div>

        <div v-else-if="step === 'choose-os'">
          <p class="text-sm font-medium text-brand-700">Tutorial</p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">
            Choose your OS
          </h1>
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
            @click="step = 'download'"
          >
            Back to Download
          </button>
        </div>

        <div v-else>
          <p class="text-sm font-medium text-brand-700">
            {{ step === "ios" ? "iOS tutorial" : "Android tutorial" }}
          </p>
          <h1 class="mt-2 text-2xl font-semibold text-slate-950">
            {{ step === "ios" ? "Install on iPhone" : "Install on Android" }}
          </h1>

          <ol class="mt-5 space-y-3 text-sm leading-6 text-slate-700">
            <li v-if="step === 'ios'">
              1. Tap Download App to open the App Store.
            </li>
            <li v-if="step === 'ios'">
              2. Tap Get, then confirm with Face ID, Touch ID, or passcode.
            </li>
            <li v-if="step === 'ios'">
              3. Open DeltaHi and complete your first login.
            </li>
            <li v-if="step === 'android'">
              1. Tap Download App to open Google Play.
            </li>
            <li v-if="step === 'android'">
              2. Tap Install and wait for the download to finish.
            </li>
            <li v-if="step === 'android'">
              3. Open DeltaHi and complete your first login.
            </li>
          </ol>

          <button
            type="button"
            class="mt-6 w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            :disabled="isRecordingClick"
            @click="downloadApp"
          >
            {{ isRecordingClick ? "Opening..." : "Download App" }}
          </button>
          <button
            type="button"
            class="mt-4 text-sm font-semibold text-slate-700 underline-offset-4 hover:underline"
            @click="step = 'download'"
          >
            Back to Download
          </button>
        </div>

        <p
          v-if="actionError"
          class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {{ actionError }}
        </p>
      </div>
    </section>
  </main>
</template>
