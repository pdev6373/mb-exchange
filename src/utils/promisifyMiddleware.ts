import { Request, Response, RequestHandler } from 'express';

export const promisifyMiddleware =
  (middleware: RequestHandler) =>
  (req: Request, res: Response): Promise<void> =>
    new Promise((resolve, reject) =>
      middleware(req, res, (err: unknown) => {
        if (err instanceof Error) return reject(err);
        resolve();
      }),
    );
