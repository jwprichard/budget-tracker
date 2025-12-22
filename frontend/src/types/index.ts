// API Response types (matching backend)

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
  version: string;
}
