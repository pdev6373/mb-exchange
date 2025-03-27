"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
exports.Validate = Validate;
const zod_1 = require("zod");
const tsoa_1 = require("tsoa");
const customErrors_1 = require("../utils/customErrors");
const validateRequest = (schema, target) => async (req, res, next) => {
    try {
        if (target === 'body')
            await schema.parseAsync(req.body);
        else if (target === 'query')
            await schema.parseAsync(req.query);
        else if (target === 'params')
            await schema.parseAsync(req.params);
        else if (target === 'all')
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
        next();
    }
    catch (error) {
        if (error instanceof zod_1.ZodError)
            throw new customErrors_1.BadRequestError(error.errors.map((error) => error.message).join(', '));
        else
            next(error);
    }
};
exports.validateRequest = validateRequest;
function Validate(schema, target = 'body') {
    return (0, tsoa_1.Middlewares)((0, exports.validateRequest)(schema, target));
}
//# sourceMappingURL=validateRequest.js.map