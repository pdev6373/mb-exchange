export function successResponse<T>(message = 'Success', data?: T) {
  return {
    success: true,
    message,
    data,
  };
}

export function errorResponse(message = 'Error', error?: string) {
  return {
    success: false,
    message,
    error,
  };
}
