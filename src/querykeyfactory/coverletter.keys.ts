const coverLetterKeys = {
  all: ["cover-letters"] as const,
  lists: () => [...coverLetterKeys.all, "list"] as const,
  list: (params: { page: number; limit: number; search?: string }) =>
    [
      ...coverLetterKeys.lists(),
      params.page,
      params.limit,
      params.search,
    ] as const,
  details: () => [...coverLetterKeys.all, "detail"] as const,
  detail: (id: string) => [...coverLetterKeys.details(), id] as const,
};

export default coverLetterKeys;
