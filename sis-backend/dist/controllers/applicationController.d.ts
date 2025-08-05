import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const applicationController: {
    listApplications(req: Request, res: Response): Promise<void>;
    getApplication(req: Request, res: Response): Promise<void>;
    createApplication(req: Request, res: Response): Promise<void>;
    updateApplicationStatus(req: AuthRequest, res: Response): Promise<void>;
    getUploadUrl(req: Request, res: Response): Promise<void>;
    getDownloadUrl(req: Request, res: Response): Promise<void>;
    updateDocuments(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=applicationController.d.ts.map