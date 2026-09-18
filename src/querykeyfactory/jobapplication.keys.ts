const jobApplicationKeys = {
  all: ["job-applications"] as const,
  lists: () => [...jobApplicationKeys.all, "list"] as const,
  list: (params: { page: number; limit: number; search?: string; status?: string; responseStatus?: string }) =>
    [...jobApplicationKeys.lists(), params.page, params.limit, params.search, params.status, params.responseStatus] as const,
}

export default jobApplicationKeys;