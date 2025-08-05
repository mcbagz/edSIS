interface TimeSlot {
    days: string[];
    time: string;
    period?: string;
}
interface SectionWithTime {
    id: string;
    courseId: string;
    days: string[];
    time: string | null;
    period: string | null;
    courseName?: string;
    sectionIdentifier?: string;
}
export declare function hasTimeConflict(sectionA: SectionWithTime, sectionB: SectionWithTime): boolean;
export declare function detectScheduleConflicts(sectionIds: string[]): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{
        sectionA: SectionWithTime;
        sectionB: SectionWithTime;
    }>;
}>;
export declare function getTeacherSchedule(teacherId: string, sessionId?: string): Promise<({
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        schoolId: string;
        beginDate: Date;
        endDate: Date;
        totalInstructionalDays: number;
    };
    course: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        gradeLevel: string[];
        department: string | null;
        schoolId: string;
        courseCode: string;
        description: string | null;
        credits: number;
        prerequisites: string[];
        capacity: number | null;
    };
    _count: {
        enrollments: number;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    days: string[];
    sessionId: string;
    courseId: string;
    schoolId: string;
    sectionIdentifier: string;
    teacherId: string;
    roomNumber: string | null;
    period: string | null;
    time: string | null;
    maxStudents: number;
    currentEnrollment: number;
})[]>;
export declare function getStudentSchedule(studentId: string, sessionId?: string): Promise<(({
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        schoolId: string;
        beginDate: Date;
        endDate: Date;
        totalInstructionalDays: number;
    };
    course: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        gradeLevel: string[];
        department: string | null;
        schoolId: string;
        courseCode: string;
        description: string | null;
        credits: number;
        prerequisites: string[];
        capacity: number | null;
    };
    teacher: {
        email: string;
        id: string;
        firstName: string;
        lastName: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        middleName: string | null;
        phone: string | null;
        staffUniqueId: string;
        position: string;
        department: string | null;
        hireDate: Date;
    };
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    days: string[];
    sessionId: string;
    courseId: string;
    schoolId: string;
    sectionIdentifier: string;
    teacherId: string;
    roomNumber: string | null;
    period: string | null;
    time: string | null;
    maxStudents: number;
    currentEnrollment: number;
}) | null)[]>;
export declare function generateStudentSchedule(studentId: string, requestedCourseIds: string[], sessionId: string): Promise<{
    success: boolean;
    schedule?: string[];
    conflicts?: string[];
    message?: string;
}>;
export declare function checkTeacherAvailability(teacherId: string, timeSlot: TimeSlot, sessionId: string, excludeSectionId?: string): Promise<boolean>;
export declare function checkRoomAvailability(roomNumber: string, timeSlot: TimeSlot, sessionId: string, excludeSectionId?: string): Promise<boolean>;
export {};
//# sourceMappingURL=schedulingService.d.ts.map