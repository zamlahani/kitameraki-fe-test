import axios from 'axios';
import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  error?: string;
  details?: string[];
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.headers) {
    const initHeaders = init.headers as Record<string, string>;
    Object.assign(headers, initHeaders);
  }

  try {
    const response = await axios(`${API_BASE_URL}${path}`, {
      headers,
      method: init?.method,
      data: init?.body,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as ApiErrorBody | undefined;
      throw new ApiError(error.response?.status ?? 0, body?.error ?? error.message, body?.details);
    }
    throw error;
  }
}
