import { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../generated/prisma';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map