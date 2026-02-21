const resumeKeys = {
  all: ["resumes"] as const,
  one: (id: string) => [...resumeKeys.all, id] as const,
}

export default resumeKeys;