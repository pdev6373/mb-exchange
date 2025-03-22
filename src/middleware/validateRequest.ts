import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { Middlewares } from 'tsoa';
import { BadRequestError } from '../utils/customErrors';

type Target = 'body' | 'query' | 'params' | 'all';

export const validateRequest =
  (schema: AnyZodObject, target: Target) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (target === 'body') await schema.parseAsync(req.body);
      else if (target === 'query') await schema.parseAsync(req.query);
      else if (target === 'params') await schema.parseAsync(req.params);
      else if (target === 'all')
        await schema.parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });
      next();
    } catch (error) {
      if (error instanceof ZodError)
        throw new BadRequestError(
          error.errors.map((error) => error.message).join(', '),
        );
      else next(error);
    }
  };

export function Validate(schema: AnyZodObject, target: Target = 'body') {
  return Middlewares(validateRequest(schema, target));
}
