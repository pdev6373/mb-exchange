"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
function successResponse(message = 'Success', data) {
    return {
        success: true,
        message,
        data,
    };
}
function errorResponse(message = 'Error', error) {
    return {
        success: false,
        message,
        error,
    };
}
//# sourceMappingURL=responseWrapper.js.map