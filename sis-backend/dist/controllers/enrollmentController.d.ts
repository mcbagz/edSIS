import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const enrollmentController: {
    getAvailableCourses(req: Request, res: Response): Promise<void>;
    getAvailableHomerooms(req: Request, res: Response): Promise<void>;
    enrollStudent(req: AuthRequest, res: Response): Promise<void>;
    getStudentEnrollments(req: Request, res: Response): Promise<void>;
    dropCourse(req: AuthRequest, res: Response): Promise<void>;
    checkTimeConflicts(sections: any[]): any[];
};
//# sourceMappingURL=enrollmentController.d.ts.map