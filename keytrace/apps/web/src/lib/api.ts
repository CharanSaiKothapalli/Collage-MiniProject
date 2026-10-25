import {
  RegisterRequest,
  LoginRequest,
  ChangePasswordRequest,
  KeystrokeSessionPayload,
} from "@keytrace/shared";

function getCsrfTokenFromCookie(): string | null {
  const match = document.cookie.match(new RegExp("(^| )keytrace_csrf=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(message: string, status: number, code: string = "API_ERROR", details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // Attach CSRF token if cookie exists
  const csrf = getCsrfTokenFromCookie();
  if (csrf && !["GET", "HEAD"].includes(options.method?.toUpperCase() || "GET")) {
    headers["X-CSRF-Token"] = csrf;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Ensure session cookies are sent
  });

  const contentType = response.headers.get("content-type");
  let data: any = null;

  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === "string" ? data : "Request failed");
    throw new ApiError(errorMsg, response.status, data?.code, data?.details);
  }

  return data as T;
}

export const api = {
  // Authentication
  auth: {
    register: (body: RegisterRequest) => request<{ ok: boolean; user: any; csrfToken: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: LoginRequest) => request<{ ok: boolean; user: any; csrfToken: string }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
    me: () => request<{ ok: boolean; user: any; csrfToken: string }>("/auth/me"),
    changePassword: (body: ChangePasswordRequest) => request<{ ok: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),
  },

  // Behavioural Consent
  consent: {
    getCurrent: () => request<{ ok: boolean; hasConsent: boolean; currentVersion: string; acceptedVersion?: string; timestamp?: string }>("/consent/current"),
    accept: (consentVersion: string = "1.0") => request<{ ok: boolean; hasConsent: boolean }>("/consent/accept", { method: "POST", body: JSON.stringify({ consentVersion, acceptedTerms: true }) }),
    withdraw: () => request<{ ok: boolean; hasConsent: boolean }>("/consent/withdraw", { method: "POST" }),
  },

  // Enrolment
  enrollment: {
    recordSample: (payload: KeystrokeSessionPayload) => request<{ ok: boolean; message?: string; count: number; required: number; features: any; profileStatus: string; qualityStatus: string }>("/enrollment/sessions", { method: "POST", body: JSON.stringify(payload) }),
    getStatus: () => request<{ ok: boolean; status: string; count: number; totalRecorded: number; required: number; isReady: boolean }>("/enrollment/status"),
    getSamples: () => request<{ ok: boolean; samples: any[] }>("/enrollment/samples"),
    deleteSample: (sampleId: string) => request<{ ok: boolean; remainingCount: number; profileStatus: string }>(`/enrollment/samples/${sampleId}`, { method: "DELETE" }),
    finalize: () => request<{ ok: boolean; profileStatus: string }>("/enrollment/finalize", { method: "POST" }),
  },

  // Verification
  verification: {
    startSession: (clientMetadata?: any) => request<{ ok: boolean; sessionId: string; profileStatus: string; enrolledSampleCount: number }>("/verification/sessions", { method: "POST", body: JSON.stringify({ clientMetadata }) }),
    evaluateWindow: (sessionId: string, payload: KeystrokeSessionPayload) => request<{ ok: boolean; eventId: string; decision: string; score: number | null; threshold: number; modelVersion: string; reasonCodes: string[]; qualityWarnings: string[]; featureDeviations?: Record<string, number>; sessionSummary: any }>(`/verification/sessions/${sessionId}/evaluate`, { method: "POST", body: JSON.stringify({ payload }) }),
    getSession: (sessionId: string) => request<{ ok: boolean; session: any; events: any[] }>(`/verification/sessions/${sessionId}`),
    endSession: (sessionId: string) => request<{ ok: boolean; session: any }>(`/verification/sessions/${sessionId}/end`, { method: "POST" }),
  },

  // History
  history: {
    getEvents: (page: number = 1, limit: number = 10, decision?: string) => {
      const q = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
      if (decision) q.append("decision", decision);
      return request<{ ok: boolean; events: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/history?${q.toString()}`);
    },
    getEventDetail: (eventId: string) => request<{ ok: boolean; event: any }>(`/history/${eventId}`),
  },

  // Analytics
  analytics: {
    getOverview: () => request<{ ok: boolean; stats: any }>("/analytics/overview"),
    getTrends: () => request<{ ok: boolean; trends: any[] }>("/analytics/verification-trends"),
    getModelPerformance: () => request<{ ok: boolean; model: any }>("/analytics/model-performance"),
  },

  // Data & Privacy
  data: {
    exportData: async () => {
      const res = await fetch("/api/v1/data/export", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to export personal data");
      return res.blob();
    },
    deleteProfile: () => request<{ ok: boolean; message: string }>("/profile", { method: "DELETE" }),
    deleteAccount: () => request<{ ok: boolean; message: string }>("/account", { method: "DELETE" }),
  },

  // Admin
  admin: {
    getOverview: () => request<{ ok: boolean; stats: any }>("/admin/overview"),
    getUsers: (page: number = 1, limit: number = 20) => request<{ ok: boolean; users: any[]; pagination: any }>(`/admin/users?page=${page}&limit=${limit}`),
    updateUserRole: (userId: string, role: string) => request<{ ok: boolean; user: any }>(`/admin/users/${userId}/role`, { method: "POST", body: JSON.stringify({ role }) }),
    getModels: () => request<{ ok: boolean; models: any[] }>("/admin/models"),
    getAuditEvents: (page: number = 1, limit: number = 50) => request<{ ok: boolean; events: any[]; pagination: any }>(`/admin/audit-events?page=${page}&limit=${limit}`),
  },

  // System Health
  health: {
    getReady: () => fetch("/health/ready").then((r) => r.json()),
  },
};
