export type ErrorResponse = {
  message: string;
  code: string;
};

export function createErrorResponse(message: string, code: string): ErrorResponse {
  return { message, code };
}
