"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCourseSection = exports.updateCourseSection = exports.createCourseSection = exports.getCourseSection = exports.getCourseSections = exports.deleteCourse = exports.updateCourse = exports.createCourse = exports.getCourse = exports.getCourses = void 0;
const prisma_1 = require("../generated/prisma");
const prisma = new prisma_1.PrismaClient();
// Get all courses
const getCourses = async (req, res) => {
    try {
        const { schoolId, gradeLevel, department, search } = req.query;
        const where = {};
        if (schoolId) {
            where.schoolId = schoolId;
        }
        if (gradeLevel) {
            where.gradeLevel = { has: gradeLevel };
        }
        if (department) {
            where.department = department;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { courseCode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        const courses = await prisma.course.findMany({
            where,
            include: {
                school: true,
                _count: {
                    select: { courseSections: true }
                }
            },
            orderBy: { courseCode: 'asc' }
        });
        res.json(courses);
    }
    catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};
exports.getCourses = getCourses;
// Get single course
const getCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                school: true,
                courseSections: {
                    include: {
                        teacher: true,
                        session: true,
                        _count: {
                            select: { enrollments: true }
                        }
                    }
                }
            }
        });
        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }
        res.json(course);
    }
    catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};
exports.getCourse = getCourse;
// Create course
const createCourse = async (req, res) => {
    try {
        const { schoolId, courseCode, name, description, credits, department, gradeLevel, prerequisites, capacity } = req.body;
        // Check if course code already exists
        const existingCourse = await prisma.course.findUnique({
            where: { courseCode }
        });
        if (existingCourse) {
            res.status(400).json({ error: 'Course code already exists' });
            return;
        }
        const course = await prisma.course.create({
            data: {
                schoolId,
                courseCode,
                name,
                description,
                credits: credits || 1.0,
                department,
                gradeLevel: gradeLevel || [],
                prerequisites: prerequisites || [],
                capacity
            },
            include: {
                school: true
            }
        });
        res.status(201).json(course);
    }
    catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
};
exports.createCourse = createCourse;
// Update course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If updating course code, check uniqueness
        if (updateData.courseCode) {
            const existingCourse = await prisma.course.findFirst({
                where: {
                    courseCode: updateData.courseCode,
                    NOT: { id }
                }
            });
            if (existingCourse) {
                res.status(400).json({ error: 'Course code already exists' });
                return;
            }
        }
        const course = await prisma.course.update({
            where: { id },
            data: updateData,
            include: {
                school: true
            }
        });
        res.json(course);
    }
    catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
};
exports.updateCourse = updateCourse;
// Delete course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if course has sections
        const sectionsCount = await prisma.courseSection.count({
            where: { courseId: id }
        });
        if (sectionsCount > 0) {
            res.status(400).json({
                error: 'Cannot delete course with existing sections. Please delete all sections first.'
            });
            return;
        }
        await prisma.course.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Failed to delete course' });
    }
};
exports.deleteCourse = deleteCourse;
// Get course sections
const getCourseSections = async (req, res) => {
    try {
        const { courseId, sessionId, teacherId, schoolId } = req.query;
        const where = {};
        if (courseId)
            where.courseId = courseId;
        if (sessionId)
            where.sessionId = sessionId;
        if (teacherId)
            where.teacherId = teacherId;
        if (schoolId)
            where.schoolId = schoolId;
        const sections = await prisma.courseSection.findMany({
            where,
            include: {
                course: true,
                teacher: true,
                session: true,
                school: true,
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: [
                { course: { courseCode: 'asc' } },
                { sectionIdentifier: 'asc' }
            ]
        });
        res.json(sections);
    }
    catch (error) {
        console.error('Error fetching course sections:', error);
        res.status(500).json({ error: 'Failed to fetch course sections' });
    }
};
exports.getCourseSections = getCourseSections;
// Get single section
const getCourseSection = async (req, res) => {
    try {
        const { id } = req.params;
        const section = await prisma.courseSection.findUnique({
            where: { id },
            include: {
                course: true,
                teacher: true,
                session: true,
                school: true,
                enrollments: {
                    include: {
                        student: true
                    }
                },
                _count: {
                    select: { enrollments: true }
                }
            }
        });
        if (!section) {
            res.status(404).json({ error: 'Section not found' });
            return;
        }
        res.json(section);
    }
    catch (error) {
        console.error('Error fetching section:', error);
        res.status(500).json({ error: 'Failed to fetch section' });
    }
};
exports.getCourseSection = getCourseSection;
// Create course section
const createCourseSection = async (req, res) => {
    try {
        const { courseId, schoolId, sessionId, sectionIdentifier, teacherId, roomNumber, period, time, days, maxStudents } = req.body;
        // Check if section identifier is unique for this course and session
        const existingSection = await prisma.courseSection.findFirst({
            where: {
                courseId,
                sessionId,
                sectionIdentifier
            }
        });
        if (existingSection) {
            res.status(400).json({
                error: 'Section identifier already exists for this course and session'
            });
            return;
        }
        const section = await prisma.courseSection.create({
            data: {
                courseId,
                schoolId,
                sessionId,
                sectionIdentifier,
                teacherId,
                roomNumber,
                period,
                time,
                days: days || [],
                maxStudents,
                currentEnrollment: 0
            },
            include: {
                course: true,
                teacher: true,
                session: true,
                school: true
            }
        });
        res.status(201).json(section);
    }
    catch (error) {
        console.error('Error creating section:', error);
        res.status(500).json({ error: 'Failed to create section' });
    }
};
exports.createCourseSection = createCourseSection;
// Update course section
const updateCourseSection = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // If updating section identifier, check uniqueness
        if (updateData.sectionIdentifier) {
            const currentSection = await prisma.courseSection.findUnique({
                where: { id }
            });
            if (currentSection) {
                const existingSection = await prisma.courseSection.findFirst({
                    where: {
                        courseId: currentSection.courseId,
                        sessionId: currentSection.sessionId,
                        sectionIdentifier: updateData.sectionIdentifier,
                        NOT: { id }
                    }
                });
                if (existingSection) {
                    res.status(400).json({
                        error: 'Section identifier already exists for this course and session'
                    });
                    return;
                }
            }
        }
        const section = await prisma.courseSection.update({
            where: { id },
            data: updateData,
            include: {
                course: true,
                teacher: true,
                session: true,
                school: true
            }
        });
        res.json(section);
    }
    catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ error: 'Failed to update section' });
    }
};
exports.updateCourseSection = updateCourseSection;
// Delete course section
const deleteCourseSection = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if section has enrollments
        const enrollmentsCount = await prisma.enrollment.count({
            where: { courseSectionId: id }
        });
        if (enrollmentsCount > 0) {
            res.status(400).json({
                error: 'Cannot delete section with existing enrollments. Please remove all enrollments first.'
            });
            return;
        }
        await prisma.courseSection.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ error: 'Failed to delete section' });
    }
};
exports.deleteCourseSection = deleteCourseSection;
//# sourceMappingURL=courseController.js.map