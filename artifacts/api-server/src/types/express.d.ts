import type { AccessTokenPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      /** Set by authenticate middleware when a valid Bearer token is present. */
      user?: AccessTokenPayload;
      /** Set by correlationId middleware — present on every request. */
      correlationId?: string;
    }
  }
}

export {};
