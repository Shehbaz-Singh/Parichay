import { apiErrorSchema, ERROR_CODES } from '@parichay/shared';

// Browser-side API client. It calls this site's /api proxy (which attaches the JWT from the
// httpOnly cookie), parses the API's error format and sends the user to /login on a 401.

export class ApiError extends Error {
  constructor(
    readonly status: number, // 0 = the request never got an answer
    readonly code: string,
    message: string,
    readonly details: { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown; // sent as JSON
  form?: FormData; // sent as multipart (uploads)
  signal?: AbortSignal;
  // Upload progress, 0 to 1. fetch cannot report it, so a request with this set is sent with XHR.
  onProgress?: (fraction: number) => void;
  // Login and register get a 401 for a wrong password, which is not an expired session.
  redirectOn401?: boolean;
}

// A free-tier backend that is waking up answers 502/503/504 (or drops the connection) for a
// while. Reads are safe to repeat, so they retry; writes are never repeated automatically.
const RETRY_STATUSES = new Set([502, 503, 504]);
const READ_ATTEMPTS = 3;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The same request as fetch would make, through XHR, for its upload progress events.
function sendWithProgress(path: string, options: Options): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(options.method ?? 'POST', `/api${path}`);
    xhr.responseType = 'arraybuffer';
    xhr.upload.onprogress = (e) => e.lengthComputable && options.onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      const noBody = xhr.status === 204 || xhr.status === 205;
      resolve(new Response(noBody ? null : xhr.response, { status: xhr.status }));
    };
    xhr.onerror = () => reject(new TypeError('network'));
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
    options.signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(options.form);
  });
}

async function attempt(path: string, options: Options): Promise<Response | ApiError> {
  try {
    if (options.onProgress && options.form) return await sendWithProgress(path, options);
    return await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
    });
  } catch (err) {
    if (options.signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) throw err;
    return new ApiError(
      0,
      'NETWORK',
      "We couldn't reach the server. Check your internet connection and try again.",
    );
  }
}

// Messages that say what happened and what to do next, for the errors people can actually run into.
// Anything not listed keeps the server's own wording (validation errors name the field).
const FRIENDLY: Record<string, string> = {
  [ERROR_CODES.INVALID_CREDENTIALS]:
    "That email and password don't match. Check them and try again, or create an account if you're new.",
  [ERROR_CODES.RATE_LIMITED]:
    "You've tried that a few times in a row. Wait a few minutes, then try again.",
  [ERROR_CODES.INVALID_PASSWORD]: "That isn't your current password. Check it and try again.",
  [ERROR_CODES.UPLOAD_FAILED]: "We couldn't save that image. Try again, or pick a different one.",
  [ERROR_CODES.NOTHING_FOUND]:
    "We couldn't find resume details in that file. Try a PDF with selectable text, or fill in your details by hand.",
};

const GENERIC =
  'Something went wrong on our side. Your work so far is safe. Please try again in a moment.';

async function toError(res: Response): Promise<ApiError> {
  const parsed = apiErrorSchema.safeParse(await res.json().catch(() => null));
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    return new ApiError(res.status, code, FRIENDLY[code] ?? message, details);
  }
  return new ApiError(res.status, `HTTP_${res.status}`, GENERIC);
}

export async function api<T = void>(path: string, options: Options = {}): Promise<T> {
  const isRead = (options.method ?? 'GET') === 'GET';
  const attempts = isRead ? READ_ATTEMPTS : 1;

  for (let n = 1; ; n++) {
    const result = await attempt(path, options);
    const failure = result instanceof ApiError ? result : result.ok ? null : await toError(result);
    if (!failure) {
      const res = result as Response;
      return (res.status === 204 ? undefined : await res.json()) as T;
    }

    if (failure.status === 401 && options.redirectOn401 !== false) {
      // The proxy has already dropped the dead cookie. A full navigation also resets all
      // page state. The promise never settles so callers do not flash an error meanwhile.
      window.location.assign('/login?expired=1');
      return new Promise<never>(() => {});
    }
    const retryable = failure.status === 0 || RETRY_STATUSES.has(failure.status);
    if (!retryable || n >= attempts) throw failure;
    await wait(1500 * n);
  }
}
