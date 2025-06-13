export enum ApiService {
  CORE = 'CORE',
  FILE = 'FILE',
  MAIN = 'MAIN',
}

export const BASE_URLS: Record<ApiService, string> = {
  [ApiService.CORE]: import.meta.env.VITE_CORE_BASE_URL,
  [ApiService.FILE]: import.meta.env.VITE_FILE_BASE_URL,
  [ApiService.MAIN]: import.meta.env.VITE_MAIN_BASE_URL,
}
