export const ProgrammingLanguagesVariants = ['bash', 'python', 'node', 'java', 'javascript', 'go', 'ruby', 'swift', 'c#', 'c++', 'php', 'c', 'r', 'json'] as const
export type ProgrammingLanguage = typeof ProgrammingLanguagesVariants[number]
