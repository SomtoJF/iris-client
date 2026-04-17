const jobSearchKeys = {
  all: ["job-search"] as const,
  history: () => [...jobSearchKeys.all, "history"] as const,
};

export default jobSearchKeys;
