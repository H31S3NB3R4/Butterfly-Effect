export type ErrorCode =
  | 'INVALID_REQUEST'
  | 'AI_NOT_CONFIGURED'
  | 'AI_RATE_LIMITED'
  | 'AI_TIMEOUT'
  | 'AI_INVALID_RESPONSE'
  | 'AI_UNAVAILABLE'
  | 'INVALID_SELECTION'
  | 'GRAPH_LIMIT_REACHED'
  | 'DEPTH_LIMIT_REACHED'

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
  }
}
