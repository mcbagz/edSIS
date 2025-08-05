"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentController = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.studentController = {
    // List all students with pagination and search
    async listStudents(req, res) {
        try {
            const { q, // search query
            limit = 10, offset = 0, gradeLevel, enrollmentStatus = 'Active' } = req.query;
            const where = {
                enrollmentStatus,
            };
            // Search by name or student ID
            if (q) {
                where.OR = [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                    { studentUniqueId: { contains: q, mode: 'insensitive' } },
                ];
            }
            if (gradeLevel) {
                where.gradeLevel = gradeLevel;
            }
            const [students, totalCount] = await Promise.all([
                database_1.default.student.findMany({
                    where,
                    skip: Number(offset),
                    take: Number(limit),
                    include: {
                        user: {
                            select: {
                                email: true,
                                isActive: true,
                            },
                        },
                        enrollments: {
                            where: { status: 'Active' },
                            include: {
                                homeroom: {
                                    include: {
                                        teacher: {
                                            select: {
                                                firstName: true,
                                                lastName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: [
                        { lastName: 'asc' },
                        { firstName: 'asc' },
                    ],
                }),
                database_1.default.student.count({ where }),
            ]);
            // Transform data to match frontend expectations
            const transformedStudents = students.map(student => ({
                id: student.id,
                studentUniqueId: student.studentUniqueId,
                firstName: student.firstName,
                lastSurname: student.lastName,
                middleName: student.middleName,
                birthDate: student.birthDate,
                birthSex: student.gender,
                gradeLevel: student.gradeLevel,
                enrollmentDate: student.enrollmentDate,
                enrollmentStatus: student.enrollmentStatus,
                email: student.email || student.user?.email,
                phone: student.phone,
                address: student.address,
                city: student.city,
                state: student.state,
                zipCode: student.zipCode,
                homeroom: student.enrollments[0]?.homeroom ? {
                    name: student.enrollments[0].homeroom.name,
                    teacher: `${student.enrollments[0].homeroom.teacher.firstName} ${student.enrollments[0].homeroom.teacher.lastName}`,
                } : null,
            }));
            res.json({
                students: transformedStudents,
                totalCount,
            });
        }
        catch (error) {
            console.error('Error fetching students:', error);
            res.status(500).json({ message: 'Failed to fetch students' });
        }
    },
    // Get single student by ID
    async getStudent(req, res) {
        try {
            const { id } = req.params;
            const student = await database_1.default.student.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            email: true,
                            isActive: true,
                        },
                    },
                    studentParents: {
                        include: {
                            parent: {
                                include: {
                                    user: {
                                        select: {
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    enrollments: {
                        where: { status: 'Active' },
                        include: {
                            courseSection: {
                                include: {
                                    course: true,
                                    teacher: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            },
                            homeroom: {
                                include: {
                                    teacher: {
                                        select: {
                                            firstName: true,
                                            lastName: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    attendances: {
                        orderBy: { date: 'desc' },
                        take: 10,
                    },
                    grades: {
                        include: {
                            courseSection: {
                                include: {
                                    course: true,
                                },
                            },
                            assignment: true,
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                    },
                },
            });
            if (!student) {
                res.status(404).json({ message: 'Student not found' });
                return;
            }
            // Transform to match frontend expectations
            const transformed = {
                id: student.id,
                studentUniqueId: student.studentUniqueId,
                firstName: student.firstName,
                lastSurname: student.lastName,
                middleName: student.middleName,
                birthDate: student.birthDate,
                birthSex: student.gender,
                gradeLevel: student.gradeLevel,
                enrollmentDate: student.enrollmentDate,
                enrollmentStatus: student.enrollmentStatus,
                email: student.email || student.user?.email,
                phone: student.phone,
                address: student.address,
                city: student.city,
                state: student.state,
                zipCode: student.zipCode,
                emergencyContact: {
                    name: student.emergencyContactName,
                    phone: student.emergencyContactPhone,
                    relationship: student.emergencyContactRelation,
                },
                medical: {
                    conditions: student.medicalConditions,
                    medications: student.medications,
                    allergies: student.allergies,
                    instructions: student.emergencyMedicalInstructions,
                },
                parents: student.studentParents.map(sp => ({
                    id: sp.parent.id,
                    name: `${sp.parent.firstName} ${sp.parent.lastName}`,
                    email: sp.parent.email || sp.parent.user?.email,
                    phone: sp.parent.phone,
                    relationship: sp.relationship,
                    isPrimary: sp.isPrimary,
                })),
                enrollments: student.enrollments,
                recentAttendance: student.attendances,
                recentGrades: student.grades,
            };
            res.json(transformed);
        }
        catch (error) {
            console.error('Error fetching student:', error);
            res.status(500).json({ message: 'Failed to fetch student' });
        }
    },
    // Create new student
    async createStudent(req, res) {
        try {
            const studentData = req.body;
            // Generate unique student ID
            const studentCount = await database_1.default.student.count();
            const studentUniqueId = `STU${String(studentCount + 1).padStart(6, '0')}`;
            const student = await database_1.default.student.create({
                data: {
                    ...studentData,
                    studentUniqueId,
                    birthDate: new Date(studentData.birthDate),
                },
            });
            res.status(201).json(student);
        }
        catch (error) {
            console.error('Error creating student:', error);
            res.status(500).json({ message: 'Failed to create student' });
        }
    },
    // Update student
    async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (updateData.birthDate) {
                updateData.birthDate = new Date(updateData.birthDate);
            }
            const student = await database_1.default.student.update({
                where: { id },
                data: updateData,
            });
            res.json(student);
        }
        catch (error) {
            console.error('Error updating student:', error);
            res.status(500).json({ message: 'Failed to update student' });
        }
    },
    // Delete student (soft delete by changing enrollment status)
    async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            await database_1.default.student.update({
                where: { id },
                data: {
                    enrollmentStatus: 'Inactive',
                },
            });
            res.json({ message: 'Student deactivated successfully' });
        }
        catch (error) {
            console.error('Error deleting student:', error);
            res.status(500).json({ message: 'Failed to delete student' });
        }
    },
    // Get student grades
    async getStudentGrades(req, res) {
        try {
            const { id } = req.params;
            const { courseSectionId, gradingPeriodId } = req.query;
            const where = { studentId: id };
            if (courseSectionId)
                where.courseSectionId = courseSectionId;
            if (gradingPeriodId)
                where.gradingPeriodId = gradingPeriodId;
            const grades = await database_1.default.grade.findMany({
                where,
                include: {
                    courseSection: {
                        include: {
                            course: true,
                            teacher: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    assignment: true,
                    gradingPeriod: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json(grades);
        }
        catch (error) {
            console.error('Error fetching student grades:', error);
            res.status(500).json({ message: 'Failed to fetch grades' });
        }
    },
    // Get student attendance
    async getStudentAttendance(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const where = { studentId: id };
            if (startDate || endDate) {
                where.date = {};
                if (startDate)
                    where.date.gte = new Date(startDate);
                if (endDate)
                    where.date.lte = new Date(endDate);
            }
            const attendance = await database_1.default.attendance.findMany({
                where,
                include: {
                    courseSection: {
                        include: {
                            course: true,
                        },
                    },
                },
                orderBy: { date: 'desc' },
            });
            res.json(attendance);
        }
        catch (error) {
            console.error('Error fetching student attendance:', error);
            res.status(500).json({ message: 'Failed to fetch attendance' });
        }
    },
};
//# sourceMappingURL=studentController.js.map