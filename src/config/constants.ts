export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const BCRYPT_ROUNDS = 10;

export const ALLOWED_FILE_EXTENSIONS = ['.ipynb', '.md'] as const;
export const ALLOWED_MIME_TYPES = [
  'application/x-ipynb+json',
  'application/json',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
  'application/octet-stream',
] as const;

export const FILE_TYPE_MAP: Record<string, 'NOTEBOOK' | 'MARKDOWN'> = {
  '.ipynb': 'NOTEBOOK',
  '.md': 'MARKDOWN',
};
