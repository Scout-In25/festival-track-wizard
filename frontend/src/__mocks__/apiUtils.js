import { vi } from 'vitest';

export const getApiKey = vi.fn(() => 'test-api-key');
export const getApiBaseUrl = vi.fn(() => 'https://test-api.example.com');
export const createApiClient = vi.fn(() => ({
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
}));
export const apiRequest = vi.fn();
