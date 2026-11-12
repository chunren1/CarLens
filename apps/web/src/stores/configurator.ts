import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { OptionCatalog, QuoteInput, QuoteResult } from "@wangshu/shared";
import { api, errorMessage } from "../lib/api";

export type CatalogState = "loading" | "ready" | "error";
export type QuoteState = "idle" | "loading" | "ready" | "error";

/** 报价防抖：连续切换选项只发一次请求。 */
const QUOTE_DEBOUNCE_MS = 300;

export const useConfiguratorStore = defineStore("configurator", () => {
  const catalog = shallowRef<OptionCatalog | null>(null);
  const catalogState = ref<CatalogState>("loading");
  const catalogError = ref("");

  const trimId = ref(0);
  const paintId = ref(0);
  const wheelId = ref(0);
  const interiorId = ref(0);
  const packageIds = ref<number[]>([]);

  const quote = shallowRef<QuoteResult | null>(null);
  const quoteState = ref<QuoteState>("idle");
  const quoteError = ref("");

  let quoteTimer: ReturnType<typeof setTimeout> | null = null;
  let requestToken = 0;
  let activeSlug = "";

  const trims = computed(() => catalog.value?.trims ?? []);
  const paints = computed(() => catalog.value?.paints ?? []);
  const wheels = computed(() => catalog.value?.wheels ?? []);
  const interiors = computed(() => catalog.value?.interiors ?? []);
  const packages = computed(() => catalog.value?.packages ?? []);

  const selectedTrim = computed(
    () => trims.value.find((item) => item.id === trimId.value) ?? null,
  );
  const selectedPaint = computed(
    () => paints.value.find((item) => item.id === paintId.value) ?? null,
  );
  const selectedWheel = computed(
    () => wheels.value.find((item) => item.id === wheelId.value) ?? null,
  );
  const selectedInterior = computed(
    () => interiors.value.find((item) => item.id === interiorId.value) ?? null,
  );

  const input = computed<QuoteInput | null>(() => {
    const current = catalog.value;
    if (!current) return null;
    return {
      modelSlug: current.model.slug,
      trimId: trimId.value,
      paintId: paintId.value,
      wheelId: wheelId.value,
      interiorId: interiorId.value,
      packageIds: [...packageIds.value],
    };
  });

  function cancelPendingQuote(): void {
    if (quoteTimer !== null) {
      clearTimeout(quoteTimer);
      quoteTimer = null;
    }
  }

  function applyDefaults(current: OptionCatalog, preferredTrimId?: number): void {
    const preferred = current.trims.find((trim) => trim.id === preferredTrimId);
    trimId.value = preferred?.id ?? current.trims[0]?.id ?? 0;
    const preferredPaint =
      current.paints.find((paint) => /白|银/.test(paint.name)) ??
      current.paints.find((paint) => paint.price === 0) ??
      current.paints[0];
    paintId.value = preferredPaint?.id ?? 0;
    wheelId.value = current.wheels[0]?.id ?? 0;
    interiorId.value = current.interiors[0]?.id ?? 0;
    packageIds.value = [];
  }

  async function fetchQuote(): Promise<void> {
    const payload = input.value;
    if (!payload) return;
    const token = ++requestToken;
    quoteState.value = "loading";
    try {
      const result = await api.createQuote(payload);
      if (token !== requestToken) return;
      quote.value = result;
      quoteError.value = "";
      quoteState.value = "ready";
    } catch (error) {
      if (token !== requestToken) return;
      // 非法组合：保留上一次报价，显示服务端返回的 message。
      quoteState.value = "error";
      quoteError.value = errorMessage(error);
    }
  }

  function requestQuote(): void {
    cancelPendingQuote();
    quoteTimer = setTimeout(() => {
      quoteTimer = null;
      void fetchQuote();
    }, QUOTE_DEBOUNCE_MS);
  }

  async function loadCatalog(slug: string, preferredTrimId?: number): Promise<void> {
    cancelPendingQuote();
    requestToken += 1;
    activeSlug = slug;
    catalog.value = null;
    catalogState.value = "loading";
    catalogError.value = "";
    quote.value = null;
    quoteState.value = "idle";
    quoteError.value = "";

    try {
      const next = await api.getOptions(slug);
      if (activeSlug !== slug) return;
      catalog.value = next;
      applyDefaults(next, preferredTrimId);
      catalogState.value = "ready";
      await fetchQuote();
    } catch (error) {
      if (activeSlug !== slug) return;
      catalogState.value = "error";
      catalogError.value = errorMessage(error);
    }
  }

  function selectTrim(id: number): void {
    if (trimId.value === id) return;
    trimId.value = id;
    requestQuote();
  }

  function selectPaint(id: number): void {
    if (paintId.value === id) return;
    paintId.value = id;
    requestQuote();
  }

  function selectWheel(id: number): void {
    if (wheelId.value === id) return;
    wheelId.value = id;
    requestQuote();
  }

  function selectInterior(id: number): void {
    if (interiorId.value === id) return;
    interiorId.value = id;
    requestQuote();
  }

  function togglePackage(id: number): void {
    if (packageIds.value.includes(id)) {
      packageIds.value = packageIds.value.filter((item) => item !== id);
    } else {
      packageIds.value = [...packageIds.value, id];
    }
    requestQuote();
  }

  return {
    catalog,
    catalogState,
    catalogError,
    trimId,
    paintId,
    wheelId,
    interiorId,
    packageIds,
    quote,
    quoteState,
    quoteError,
    trims,
    paints,
    wheels,
    interiors,
    packages,
    selectedTrim,
    selectedPaint,
    selectedWheel,
    selectedInterior,
    input,
    loadCatalog,
    fetchQuote,
    requestQuote,
    cancelPendingQuote,
    selectTrim,
    selectPaint,
    selectWheel,
    selectInterior,
    togglePackage,
  };
});