import axios from "axios";
import { API_BASE_URL } from '../config';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init?.headers) {
    const initHeaders = init.headers as Record<string, string>;
    Object.assign(headers, initHeaders);
  }

  const response = await axios(`${API_BASE_URL}${path}`, {
    headers,
    method: init?.method,
    data: init?.body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = response.data;

  return body as T;
}