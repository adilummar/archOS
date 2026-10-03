export class ApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(status: number, message: string, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any;
  try {
    body = await res.json();
  } catch (err) {
    body = null;
  }

  if (!res.ok) {
    const errorMsg = body?.error || body?.message || res.statusText || 'Something went wrong';
    let code = body?.code;

    if (res.status === 401) code = 'UNAUTHORIZED';
    if (res.status === 403) {
      if (errorMsg.includes('Feature not enabled')) {
        code = 'FEATURE_DISABLED';
      } else if (errorMsg.includes('suspended')) {
        code = 'FIRM_SUSPENDED';
      } else if (errorMsg.includes('deactivated')) {
        code = 'USER_DEACTIVATED';
      } else {
        code = 'FORBIDDEN';
      }
    }
    if (res.status === 404) code = 'NOT_FOUND';
    if (res.status === 409) code = 'CONFLICT';
    if (res.status === 422) code = 'VALIDATION';

    throw new ApiError(res.status, errorMsg, code, body);
  }

  return body as T;
}

const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Centralized API client methods
export const api = {
  async get<T>(url: string, params?: Record<string, string>): Promise<T> {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(url + qs, {
      method: 'GET',
      headers: defaultHeaders,
    });
    return handleResponse<T>(res);
  },

  async post<T>(url: string, data: any): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<T>(res);
  },

  async patch<T>(url: string, data: any): Promise<T> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<T>(res);
  },

  async put<T>(url: string, data: any): Promise<T> {
    const res = await fetch(url, {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(data),
    });
    return handleResponse<T>(res);
  },

  async delete<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: defaultHeaders,
    });
    return handleResponse<T>(res);
  },
};
