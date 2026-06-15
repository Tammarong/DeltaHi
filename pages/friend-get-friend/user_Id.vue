<script setup lang="ts">
import deltaLogoUrl from "~/assets/img/Delta_Logo.png";
import deltaHiBannerUrl from "~/assets/img/DeltaHi Banner.svg";

type EmployeeShare = {
  id: string;
  userId: string;
  employeeId: string;
  employeeName: string;
  pointBalance: number | null;
  shareUrl: string;
  createdAt: string;
  updatedAt: string;
};

type GetEmployeeShareResponse = {
  share: EmployeeShare;
};

type CheckUserResponse = {
  status: number;
  message: string;
  data: null | {
    id: string;
    employee_id: string;
    point_balance?: number | string | null;
    pointBalance?: number | string | null;
    employee_info?: {
      full_name?: string | null;
      full_name_th?: string | null;
    } | null;
  };
};

type AvailableLocale = "en" | "th";
type LocalizedMessage = {
  key: string;
  params?: Record<string, string | number>;
};

const contactTeam = [
  {
    name: "Mobile OA",
    nickname: "eTicket",
  },
];

const router = useRouter();
const { locale, setLocale, t } = useI18n();
const formError = ref<LocalizedMessage | string | null>(null);
const isCreatingShare = ref(false);
const languageMenuOpen = ref(false);
const referrerEmployeeId = ref("");
const normalizedReferrerEmployeeId = computed(() =>
  referrerEmployeeId.value.trim().toUpperCase(),
);

const languageOptions: Array<{
  code: AvailableLocale;
  label: string;
  shortLabel: string;
}> = [
  { code: "th", label: "ไทย / TH", shortLabel: "🇹🇭 TH" },
  { code: "en", label: "English / EN", shortLabel: "🇬🇧 EN" },
];

const currentLocaleCode = computed<AvailableLocale>(() =>
  locale.value === "th" ? "th" : "en",
);

const currentLanguageOption = computed(
  () =>
    languageOptions.find((option) => option.code === currentLocaleCode.value) ??
    languageOptions[1],
);

const formErrorText = computed(() => {
  if (!formError.value) {
    return "";
  }

  if (typeof formError.value === "string") {
    return formError.value;
  }

  return t(formError.value.key, formError.value.params ?? {});
});

function getStatusMessage(error: unknown): LocalizedMessage | string {
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

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return { key: "qrPage.errors.unavailable" };
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

async function submitReferrerEmployeeId() {
  if (isCreatingShare.value) {
    return;
  }

  formError.value = null;

  if (!normalizedReferrerEmployeeId.value) {
    formError.value = { key: "qrPage.errors.enterEmployeeId" };
    return;
  }

  isCreatingShare.value = true;

  try {
    const response = await $fetch<CheckUserResponse>(
      "/api/friend-get-friend/check-user",
      {
        query: {
          employee_id: normalizedReferrerEmployeeId.value,
        },
      },
    );

    if (!response.data?.id || !response.data.employee_id) {
      throw new Error("User was not found.");
    }

    const { share } = await $fetch<GetEmployeeShareResponse>(
      "/api/employee-shares",
      {
        method: "POST",
        body: {
          userId: response.data.id,
          employeeId: response.data.employee_id,
          pointBalance:
            response.data.point_balance ?? response.data.pointBalance ?? null,
        },
      },
    );

    await router.push({
      path: "/friend-get-friend/qr-code",
      query: {
        employeeShareId: share.id,
      },
    });
  } catch (error) {
    formError.value = getStatusMessage(error);
  } finally {
    isCreatingShare.value = false;
  }
}

watch(referrerEmployeeId, () => {
  if (formError.value) {
    formError.value = null;
  }
});
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

        <h1 class="mt-5 text-2xl font-semibold tracking-normal text-slate-950">
          {{ t("qrPage.referrer.title") }}
        </h1>

        <p class="mt-1 text-sm leading-6 text-slate-600">
          {{ t("qrPage.referrer.subtitle") }}
        </p>

        <form
          class="mt-6 space-y-4"
          :aria-busy="isCreatingShare"
          @submit.prevent="submitReferrerEmployeeId"
        >
          <label class="block">
            <span class="text-sm font-medium text-slate-800">
              {{ t("shareApp.employeeId.label") }}
            </span>
            <input
              v-model="referrerEmployeeId"
              type="text"
              inputmode="text"
              autocomplete="off"
              :disabled="isCreatingShare"
              class="mt-2 w-full rounded-md border border-slate-300 px-3 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
              :placeholder="t('shareApp.employeeId.placeholder')"
            />
          </label>

          <button
            type="submit"
            :disabled="isCreatingShare"
            class="w-full rounded-md bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {{
              isCreatingShare
                ? t("qrPage.referrer.checking")
                : t("qrPage.referrer.action")
            }}
          </button>
        </form>

        <p
          v-if="formErrorText"
          class="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {{ formErrorText }}
        </p>

        <footer class="mt-6 border-t border-slate-200 pt-5 text-sm">
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
            <section
              class="mt-3 overflow-hidden rounded-lg border border-slate-150 shadow-[0_1px_2px_rgba(23,50,77,0.06)]"
            >
              <img
                :src="deltaHiBannerUrl"
                alt="DeltaHi ads download banner"
                class="block h-auto w-full"
              />
            </section>
          </div>
        </footer>
      </div>
    </section>

    <div
      v-if="isCreatingShare"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
      role="status"
      aria-live="polite"
      aria-modal="true"
    >
      <div class="w-full max-w-sm rounded-lg bg-white p-5 text-center shadow-xl">
        <div
          class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600"
          aria-hidden="true"
        />
        <p class="mt-4 text-base font-semibold text-slate-950">
          {{ t("qrPage.referrer.checkingTitle") }}
        </p>
        <p class="mt-2 text-sm leading-6 text-slate-600">
          {{ t("qrPage.referrer.checkingDescription") }}
        </p>
      </div>
    </div>
  </main>
</template>
