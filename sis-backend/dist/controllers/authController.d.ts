import { Request, Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
export declare const authController: {
    login(req: Request, res: Response): Promise<void>;
    getCurrentUser(req: AuthRequest, res: Response): Promise<void>;
    changePassword(req: AuthRequest, res: Response): Promise<void>;
    logout(_req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=authController.d.ts.map