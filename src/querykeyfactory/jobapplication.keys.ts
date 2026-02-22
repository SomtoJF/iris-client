const jobApplicationKeys = {
  all: ["job-applications"] as const,
  lists: () => [...jobApplicationKeys.all, "list"] as const,
  list: (params: { page: number; limit: number }) =>
    [...jobApplicationKeys.lists(), params.page, params.limit] as const,
}

export default jobApplicationKeys;