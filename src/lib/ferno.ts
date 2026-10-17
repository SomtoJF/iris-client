type AnalyticsClient = {
  load(settings: unknown, options?: unknown): AnalyticsClient;
  track(name: string): Promise<unknown>;
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
    analytics.load(
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
        instrumentation: { rageClicks: true, deadClicks: true },
        integrations: {
          "Segment.io": { apiHost, apiPath, authMode: "bearer" },
        },
      },
    );
    return analytics as AnalyticsClient;
  });

  return analyticsPromise;
}

export function initializeFerno() {
  void loadFerno();
}

export function trackFernoEvent(name: "signed_in" | "signed_up" | "logged_out") {
  void loadFerno().then((analytics) => analytics?.track(name));
}
