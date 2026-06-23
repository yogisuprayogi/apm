export const getApiUrl = (path: string): string => {
  // Normalize path to start with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Check config in localStorage first (dynamic override for testing/flexibility)
  if (typeof window !== 'undefined') {
    const localOverride = localStorage.getItem('SMAN2_API_URL');
    if (localOverride) {
      const base = localOverride.endsWith('/') 
        ? localOverride.slice(0, -1) 
        : localOverride;
      return `${base}${cleanPath}`;
    }
  }

  // Fallback to Vite env variable
  const envBase = ((import.meta as any).env?.VITE_API_URL as string) || '';
  if (envBase) {
    const base = envBase.endsWith('/') 
      ? envBase.slice(0, -1) 
      : envBase;
    return `${base}${cleanPath}`;
  }

  // Default to relative local api
  return cleanPath;
};
