export const __esModule: boolean;
export namespace Prisma {
    namespace TransactionIsolationLevel {
        let ReadUncommitted: string;
        let ReadCommitted: string;
        let RepeatableRead: string;
        let Serializable: string;
    }
    namespace UserScalarFieldEnum {
        let id: string;
        let email: string;
        let password: string;
        let role: string;
        let firstName: string;
        let lastName: string;
        let isActive: string;
        let createdAt: string;
        let updatedAt: string;
    }
    namespace ProspectiveStudentScalarFieldEnum {
        let id_1: string;
        export { id_1 as id };
        let firstName_1: string;
        export { firstName_1 as firstName };
        let lastName_1: string;
        export { lastName_1 as lastName };
        export let dateOfBirth: string;
        export let gender: string;
        export let ethnicity: string;
        let email_1: string;
        export { email_1 as email };
        export let phone: string;
        export let address: string;
        export let city: string;
        export let state: string;
        export let zipCode: string;
        export let guardianName: string;
        export let guardianEmail: string;
        export let guardianPhone: string;
        export let guardianRelation: string;
        let createdAt_1: string;
        export { createdAt_1 as createdAt };
        let updatedAt_1: string;
        export { updatedAt_1 as updatedAt };
    }
    namespace ApplicationScalarFieldEnum {
        let id_2: string;
        export { id_2 as id };
        export let prospectiveStudentId: string;
        export let status: string;
        export let applicationDate: string;
        export let documents: string;
        export let notes: string;
        export let reviewedBy: string;
        export let reviewedAt: string;
        export let acceptanceEmailSent: string;
        let createdAt_2: string;
        export { createdAt_2 as createdAt };
        let updatedAt_2: string;
        export { updatedAt_2 as updatedAt };
    }
    namespace StudentScalarFieldEnum {
        let id_3: string;
        export { id_3 as id };
        export let userId: string;
        export let studentUniqueId: string;
        let firstName_2: string;
        export { firstName_2 as firstName };
        let lastName_2: string;
        export { lastName_2 as lastName };
        export let middleName: string;
        export let birthDate: string;
        let gender_1: string;
        export { gender_1 as gender };
        let ethnicity_1: string;
        export { ethnicity_1 as ethnicity };
        export let gradeLevel: string;
        export let enrollmentDate: string;
        export let enrollmentStatus: string;
        let email_2: string;
        export { email_2 as email };
        let phone_1: string;
        export { phone_1 as phone };
        let address_1: string;
        export { address_1 as address };
        let city_1: string;
        export { city_1 as city };
        let state_1: string;
        export { state_1 as state };
        let zipCode_1: string;
        export { zipCode_1 as zipCode };
        export let emergencyContactName: string;
        export let emergencyContactPhone: string;
        export let emergencyContactRelation: string;
        export let medicalConditions: string;
        export let medications: string;
        export let allergies: string;
        export let emergencyMedicalInstructions: string;
        let createdAt_3: string;
        export { createdAt_3 as createdAt };
        let updatedAt_3: string;
        export { updatedAt_3 as updatedAt };
    }
    namespace ParentScalarFieldEnum {
        let id_4: string;
        export { id_4 as id };
        let userId_1: string;
        export { userId_1 as userId };
        let firstName_3: string;
        export { firstName_3 as firstName };
        let lastName_3: string;
        export { lastName_3 as lastName };
        let email_3: string;
        export { email_3 as email };
        let phone_2: string;
        export { phone_2 as phone };
        let address_2: string;
        export { address_2 as address };
        let city_2: string;
        export { city_2 as city };
        let state_2: string;
        export { state_2 as state };
        let zipCode_2: string;
        export { zipCode_2 as zipCode };
        let createdAt_4: string;
        export { createdAt_4 as createdAt };
        let updatedAt_4: string;
        export { updatedAt_4 as updatedAt };
    }
    namespace StudentParentScalarFieldEnum {
        let id_5: string;
        export { id_5 as id };
        export let studentId: string;
        export let parentId: string;
        export let relationship: string;
        export let isPrimary: string;
        export let hasLegalCustody: string;
        let createdAt_5: string;
        export { createdAt_5 as createdAt };
        let updatedAt_5: string;
        export { updatedAt_5 as updatedAt };
    }
    namespace StaffScalarFieldEnum {
        let id_6: string;
        export { id_6 as id };
        let userId_2: string;
        export { userId_2 as userId };
        export let staffUniqueId: string;
        let firstName_4: string;
        export { firstName_4 as firstName };
        let lastName_4: string;
        export { lastName_4 as lastName };
        let middleName_1: string;
        export { middleName_1 as middleName };
        let email_4: string;
        export { email_4 as email };
        let phone_3: string;
        export { phone_3 as phone };
        export let position: string;
        export let department: string;
        export let hireDate: string;
        let createdAt_6: string;
        export { createdAt_6 as createdAt };
        let updatedAt_6: string;
        export { updatedAt_6 as updatedAt };
    }
    namespace SchoolScalarFieldEnum {
        let id_7: string;
        export { id_7 as id };
        export let schoolId: string;
        export let name: string;
        export let type: string;
        let address_3: string;
        export { address_3 as address };
        let city_3: string;
        export { city_3 as city };
        let state_3: string;
        export { state_3 as state };
        let zipCode_3: string;
        export { zipCode_3 as zipCode };
        let phone_4: string;
        export { phone_4 as phone };
        export let principal: string;
        let createdAt_7: string;
        export { createdAt_7 as createdAt };
        let updatedAt_7: string;
        export { updatedAt_7 as updatedAt };
    }
    namespace SessionScalarFieldEnum {
        let id_8: string;
        export { id_8 as id };
        let schoolId_1: string;
        export { schoolId_1 as schoolId };
        let name_1: string;
        export { name_1 as name };
        export let beginDate: string;
        export let endDate: string;
        export let totalInstructionalDays: string;
        let createdAt_8: string;
        export { createdAt_8 as createdAt };
        let updatedAt_8: string;
        export { updatedAt_8 as updatedAt };
    }
    namespace GradingPeriodScalarFieldEnum {
        let id_9: string;
        export { id_9 as id };
        export let sessionId: string;
        let schoolId_2: string;
        export { schoolId_2 as schoolId };
        let name_2: string;
        export { name_2 as name };
        let beginDate_1: string;
        export { beginDate_1 as beginDate };
        let endDate_1: string;
        export { endDate_1 as endDate };
        let createdAt_9: string;
        export { createdAt_9 as createdAt };
        let updatedAt_9: string;
        export { updatedAt_9 as updatedAt };
    }
    namespace HomeroomScalarFieldEnum {
        let id_10: string;
        export { id_10 as id };
        let schoolId_3: string;
        export { schoolId_3 as schoolId };
        let name_3: string;
        export { name_3 as name };
        export let teacherId: string;
        export let roomNumber: string;
        export let capacity: string;
        let gradeLevel_1: string;
        export { gradeLevel_1 as gradeLevel };
        let createdAt_10: string;
        export { createdAt_10 as createdAt };
        let updatedAt_10: string;
        export { updatedAt_10 as updatedAt };
    }
    namespace CourseScalarFieldEnum {
        let id_11: string;
        export { id_11 as id };
        let schoolId_4: string;
        export { schoolId_4 as schoolId };
        export let courseCode: string;
        let name_4: string;
        export { name_4 as name };
        export let description: string;
        export let credits: string;
        let department_1: string;
        export { department_1 as department };
        let gradeLevel_2: string;
        export { gradeLevel_2 as gradeLevel };
        export let prerequisites: string;
        let capacity_1: string;
        export { capacity_1 as capacity };
        let createdAt_11: string;
        export { createdAt_11 as createdAt };
        let updatedAt_11: string;
        export { updatedAt_11 as updatedAt };
    }
    namespace CourseSectionScalarFieldEnum {
        let id_12: string;
        export { id_12 as id };
        export let courseId: string;
        let schoolId_5: string;
        export { schoolId_5 as schoolId };
        let sessionId_1: string;
        export { sessionId_1 as sessionId };
        export let sectionIdentifier: string;
        let teacherId_1: string;
        export { teacherId_1 as teacherId };
        let roomNumber_1: string;
        export { roomNumber_1 as roomNumber };
        export let period: string;
        export let time: string;
        export let days: string;
        export let maxStudents: string;
        export let currentEnrollment: string;
        let createdAt_12: string;
        export { createdAt_12 as createdAt };
        let updatedAt_12: string;
        export { updatedAt_12 as updatedAt };
    }
    namespace EnrollmentScalarFieldEnum {
        let id_13: string;
        export { id_13 as id };
        let studentId_1: string;
        export { studentId_1 as studentId };
        export let courseSectionId: string;
        export let homeroomId: string;
        let enrollmentDate_1: string;
        export { enrollmentDate_1 as enrollmentDate };
        export let exitDate: string;
        let status_1: string;
        export { status_1 as status };
        export let grade: string;
        let createdAt_13: string;
        export { createdAt_13 as createdAt };
        let updatedAt_13: string;
        export { updatedAt_13 as updatedAt };
    }
    namespace AttendanceScalarFieldEnum {
        let id_14: string;
        export { id_14 as id };
        let studentId_2: string;
        export { studentId_2 as studentId };
        let courseSectionId_1: string;
        export { courseSectionId_1 as courseSectionId };
        export let date: string;
        export let attendanceCode: string;
        export let minutes: string;
        let notes_1: string;
        export { notes_1 as notes };
        let createdAt_14: string;
        export { createdAt_14 as createdAt };
        let updatedAt_14: string;
        export { updatedAt_14 as updatedAt };
    }
    namespace AssignmentScalarFieldEnum {
        let id_15: string;
        export { id_15 as id };
        let courseSectionId_2: string;
        export { courseSectionId_2 as courseSectionId };
        export let title: string;
        let description_1: string;
        export { description_1 as description };
        let type_1: string;
        export { type_1 as type };
        export let dueDate: string;
        export let maxPoints: string;
        export let weight: string;
        export let category: string;
        let createdAt_15: string;
        export { createdAt_15 as createdAt };
        let updatedAt_15: string;
        export { updatedAt_15 as updatedAt };
    }
    namespace GradeScalarFieldEnum {
        let id_16: string;
        export { id_16 as id };
        let studentId_3: string;
        export { studentId_3 as studentId };
        let courseSectionId_3: string;
        export { courseSectionId_3 as courseSectionId };
        export let assignmentId: string;
        export let gradingPeriodId: string;
        export let gradeType: string;
        export let numericGrade: string;
        export let letterGrade: string;
        export let points: string;
        export let comment: string;
        let createdAt_16: string;
        export { createdAt_16 as createdAt };
        let updatedAt_16: string;
        export { updatedAt_16 as updatedAt };
    }
    namespace DisciplineIncidentScalarFieldEnum {
        let id_17: string;
        export { id_17 as id };
        export let incidentIdentifier: string;
        export let incidentDate: string;
        export let incidentTime: string;
        export let incidentLocation: string;
        export let reporterName: string;
        export let reporterDescription: string;
        export let behaviorCode: string;
        export let incidentDescription: string;
        let createdAt_17: string;
        export { createdAt_17 as createdAt };
        let updatedAt_17: string;
        export { updatedAt_17 as updatedAt };
    }
    namespace StudentDisciplineIncidentScalarFieldEnum {
        let id_18: string;
        export { id_18 as id };
        let studentId_4: string;
        export { studentId_4 as studentId };
        export let incidentId: string;
        export let studentRole: string;
        let createdAt_18: string;
        export { createdAt_18 as createdAt };
        let updatedAt_18: string;
        export { updatedAt_18 as updatedAt };
    }
    namespace DisciplineActionScalarFieldEnum {
        let id_19: string;
        export { id_19 as id };
        let incidentId_1: string;
        export { incidentId_1 as incidentId };
        export let actionType: string;
        export let actionDate: string;
        export let duration: string;
        let description_2: string;
        export { description_2 as description };
        export let assignedBy: string;
        let createdAt_19: string;
        export { createdAt_19 as createdAt };
        let updatedAt_19: string;
        export { updatedAt_19 as updatedAt };
    }
    namespace SortOrder {
        let asc: string;
        let desc: string;
    }
    namespace NullableJsonNullValueInput {
        import DbNull = Prisma.DbNull;
        export { DbNull };
        import JsonNull = Prisma.JsonNull;
        export { JsonNull };
    }
    namespace QueryMode {
        let _default: string;
        export { _default as default };
        export let insensitive: string;
    }
    namespace NullsOrder {
        let first: string;
        let last: string;
    }
    namespace JsonNullValueFilter {
        import DbNull_1 = Prisma.DbNull;
        export { DbNull_1 as DbNull };
        import JsonNull_1 = Prisma.JsonNull;
        export { JsonNull_1 as JsonNull };
        import AnyNull = Prisma.AnyNull;
        export { AnyNull };
    }
    namespace ModelName {
        let User: string;
        let ProspectiveStudent: string;
        let Application: string;
        let Student: string;
        let Parent: string;
        let StudentParent: string;
        let Staff: string;
        let School: string;
        let Session: string;
        let GradingPeriod: string;
        let Homeroom: string;
        let Course: string;
        let CourseSection: string;
        let Enrollment: string;
        let Attendance: string;
        let Assignment: string;
        let Grade: string;
        let DisciplineIncident: string;
        let StudentDisciplineIncident: string;
        let DisciplineAction: string;
    }
}
export namespace $Enums {
    namespace UserRole {
        let ADMIN: string;
        let TEACHER: string;
        let PARENT: string;
        let STUDENT: string;
    }
    namespace ApplicationStatus {
        let APPLIED: string;
        let ACCEPTED: string;
        let REJECTED: string;
    }
}
export namespace UserRole {
    let ADMIN_1: string;
    export { ADMIN_1 as ADMIN };
    let TEACHER_1: string;
    export { TEACHER_1 as TEACHER };
    let PARENT_1: string;
    export { PARENT_1 as PARENT };
    let STUDENT_1: string;
    export { STUDENT_1 as STUDENT };
}
export namespace ApplicationStatus {
    let APPLIED_1: string;
    export { APPLIED_1 as APPLIED };
    let ACCEPTED_1: string;
    export { ACCEPTED_1 as ACCEPTED };
    let REJECTED_1: string;
    export { REJECTED_1 as REJECTED };
}
export namespace Prisma {
    export namespace prismaVersion {
        let client: string;
        let engine: string;
    }
    export function PrismaClientKnownRequestError(): never;
    export function PrismaClientUnknownRequestError(): never;
    export function PrismaClientRustPanicError(): never;
    export function PrismaClientInitializationError(): never;
    export function PrismaClientValidationError(): never;
    export { Decimal };
    /**
     * Re-export of sql-template-tag
     */
    export function sql(): never;
    export function empty(): never;
    export function join(): never;
    export function raw(): never;
    export let validator: typeof Public.validator;
    /**
    * Extensions
    */
    export function getExtensionContext(): never;
    export function defineExtension(): never;
    let DbNull_2: {
        #private: any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { DbNull_2 as DbNull };
    let JsonNull_2: {
        #private: any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { JsonNull_2 as JsonNull };
    let AnyNull_1: {
        #private: any;
        _getNamespace(): string;
        _getName(): string;
        toString(): string;
    };
    export { AnyNull_1 as AnyNull };
    export namespace NullTypes {
        let DbNull_3: {
            new (arg?: symbol): {
                #private: any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { DbNull_3 as DbNull };
        let JsonNull_3: {
            new (arg?: symbol): {
                #private: any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { JsonNull_3 as JsonNull };
        let AnyNull_2: {
            new (arg?: symbol): {
                #private: any;
                _getNamespace(): string;
                _getName(): string;
                toString(): string;
            };
        };
        export { AnyNull_2 as AnyNull };
    }
}
/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
export class PrismaClient {
}
import { Decimal } from "./runtime/index-browser.js";
import { Public } from "./runtime/index-browser.js";
//# sourceMappingURL=index-browser.d.ts.map