import type { ProspectiveStudent } from '../generated/prisma';
export declare class EnrollmentWorkflowService {
    /**
     * Process accepted application and create student record
     */
    static processAcceptedApplication(applicationId: string): Promise<void>;
    /**
     * Send acceptance email to student
     */
    static sendAcceptanceEmail(prospectiveStudent: ProspectiveStudent, email: string, tempPassword: string): Promise<void>;
    /**
     * Send parent account creation email
     */
    static sendParentAccountEmail(email: string, name: string, tempPassword: string): Promise<void>;
    /**
     * Generate temporary password
     */
    private static generateTempPassword;
}
//# sourceMappingURL=enrollmentWorkflowService.d.ts.map