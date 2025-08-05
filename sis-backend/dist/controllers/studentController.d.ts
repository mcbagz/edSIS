import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const studentController: {
    listStudents(req: Request, res: Response): Promise<void>;
    getStudent(req: Request, res: Response): Promise<void>;
    createStudent(req: AuthRequest, res: Response): Promise<void>;
    updateStudent(req: AuthRequest, res: Response): Promise<void>;
    deleteStudent(req: AuthRequest, res: Response): Promise<void>;
    getStudentGrades(req: Request, res: Response): Promise<void>;
    getStudentAttendance(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=studentController.d.ts.map