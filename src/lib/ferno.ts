import { safelyCall } from "./ferno-safe-call";

type AnalyticsClient = {
  load(settings: unknown, options?: unknown): AnalyticsClient & PromiseLike<unknown>;
  track?: (name: string) => Promise<unknown>;
  page?: (properties?: Record<string, string>) => Promise<unknown>;
  identify?: (userId: string, traits?: Record<string, string>) => Promise<unknown>;
  reset?: () => void;
  trackForm?: (form: HTMLFormElement, name: string) => Promise<unknown>;
};

const writeKey = import.meta.env.VITE_FERNO_WRITE_KEY as string | undefined;
const apiHost =
  (import.meta.env.VITE_FERNO_API_HOST as string | undefined) ??
  "https://data.useferno.com";
const apiPath =
  (import.meta.env.VITE_FERNO_API_PATH as string | undefined) ?? "/events";

let analyticsPromise: Promise<AnalyticsClient | undefined> | undefined;

function loadFerno() {
  if (!writeKey) return Promise.resolve(undefined);

  analyticsPromise ??= import("@fernohq/analytics-next").then(({ AnalyticsBrowser }) => {
    const analytics = new AnalyticsBrowser();
    return analytics.load(
      {
        writeKey,
        cdnSettings: {
          integrations: {
            "Segment.io": { apiKey: writeKey, apiHost, apiPath, authMode: "bearer" },
          },
        },
      },
      {
        initialPageview: false,
        instrumentation: {
          rageClicks: true,
          exceptions: { enabled: true, console: true },
          heatmaps: { enabled: true, flushInterval: 10000 },
        },
        integrations: {
          "Segment.io": { apiHost, apiPath, authMode: "bearer" },
        },
      },
    ).then(() => analytics as unknown as AnalyticsClient);
  }).catch(() => undefined);

  return analyticsPromise;
}

export function initializeFerno() {
  void loadFerno();
}

let lastPage: string | undefined;
let identifiedUser: string | undefined;

export function trackFernoPage(path: string) {
  if (lastPage === path) return;
  lastPage = path;
  void loadFerno().then((analytics) => safelyCall(analytics, "page", { path }));
}

export function trackFernoEvent(name: "signed_in" | "signed_up" | "logged_out") {
  void loadFerno().then((analytics) => safelyCall(analytics, "track", name));
}

export function identifyFernoUser(
  userId: string,
  traits: Record<string, string>,
) {
  if (identifiedUser === userId) return;
  identifiedUser = userId;
  void loadFerno().then((analytics) =>
    safelyCall(analytics, "identify", userId, traits),
  );
}

export function resetFerno() {
  identifiedUser = undefined;
  void loadFerno().then((analytics) => safelyCall(analytics, "reset"));
}

export function trackAuthForm(form: HTMLFormElement, eventName: "signed_in" | "signed_up") {
  void loadFerno().then((analytics) => {
    if (!analytics || form.dataset.fernoTracked === "true") return;
    form.dataset.fernoTracked = "true";
    safelyCall(analytics, "trackForm", form, eventName);
  });
}

export function submitTrackedForm(form: HTMLFormElement) {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}
