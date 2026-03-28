const costKeys = {
  all: ["cost-tracking"] as const,
  lists: () => [...costKeys.all, "list"] as const,
  list: (params: { page: number; limit: number; userId?: string; jobApplicationId?: string }) =>
    [...costKeys.lists(), params.page, params.limit, params.userId, params.jobApplicationId] as const,
  search: (q: string) => [...costKeys.all, "search", q] as const,
};

export default costKeys;
