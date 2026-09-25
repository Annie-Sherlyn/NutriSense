import { ENV } from '../config/env';
import { auth } from '../config/firebase';
import type { AppError, AppErrorCode } from '../types';

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export class ApiError extends Error {
  appError: AppError;
  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'ApiError';
    this.appError = appError;
  }
}

export function normalizeError(error: unknown, fallbackMessage = 'An unexpected error occurred'): AppError {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = error as { code: string; message: string; action?: string; recoverable?: boolean };
    const code = (err.code as AppErrorCode) || 'UNKNOWN';
    return {
      code,
      message: err.message,
      recoverable: err.recoverable ?? true,
      action: err.action || 'Please try again.',
    };
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return {
        code: 'NETWORK',
        message: 'Request timed out after 20 seconds.',
        recoverable: true,
        action: 'Check your internet connection and retry.',
      };
    }
    return {
      code: 'NETWORK',
      message: error.message || fallbackMessage,
      recoverable: true,
      action: 'Check your connection and try again.',
    };
  }

  return {
    code: 'UNKNOWN',
    message: fallbackMessage,
    recoverable: true,
    action: 'Retry later.',
  };
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 20000, headers = {}, body, ...customConfig } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const finalHeaders = new Headers(headers);

  // Attach Firebase ID Token if user is logged in
  if (auth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      finalHeaders.set('Authorization', `Bearer ${token}`);
    } catch {
      // Ignore token fetch failure for unauthenticated or demo endpoints
    }
  }

  // Do not set Content-Type if body is FormData (browser will set boundary automatically)
  if (!(body instanceof FormData) && !finalHeaders.has('Content-Type')) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  const url = endpoint.startsWith('http') ? endpoint : `${ENV.API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: finalHeaders,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errData: { code?: string; message?: string } = {};
      try {
        errData = await response.json();
      } catch {
        // Not JSON
      }

      let code: AppErrorCode = 'UNKNOWN';
      if (response.status === 401 || response.status === 403) code = 'UNAUTHORIZED';
      else if (response.status === 413) code = 'FILE_TOO_LARGE';
      else if (response.status === 415) code = 'UNSUPPORTED_FORMAT';
      else if (response.status === 422) code = 'IMAGE_UNPROCESSABLE';
      else if (response.status >= 500) code = 'SERVICE_UNAVAILABLE';

      const appError: AppError = {
        code,
        message: errData.message || `Server returned ${response.status}: ${response.statusText}`,
        recoverable: true,
        action: code === 'UNAUTHORIZED' ? 'Please log in again.' : 'Retry in a few seconds.',
      };
      throw new ApiError(appError);
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {
      throw error.appError;
    }
    throw normalizeError(error);
  }
}
