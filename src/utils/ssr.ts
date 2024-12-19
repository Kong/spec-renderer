export const isSsr = (): boolean => {
  return (typeof window === 'undefined' || typeof document === 'undefined' || !window || !document)
}

