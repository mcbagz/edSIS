import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function seedCustomFields() {
  console.log('Seeding custom fields and attendance codes...');

  // Create custom field definitions for students
  const customFields = [
    {
      name: 'has_iep',
      label: 'Has IEP',
      fieldType: 'boolean',
      entityType: 'Student',
      required: false,
      displayOrder: 1,
    },
    {
      name: 'iep_notes',
      label: 'IEP Notes',
      fieldType: 'text',
      entityType: 'Student',
      required: false,
      displayOrder: 2,
    },
    {
      name: 'transportation_method',
      label: 'Transportation Method',
      fieldType: 'select',
      entityType: 'Student',
      options: ['Bus', 'Car', 'Walk', 'Bike', 'Other'],
      required: false,
      displayOrder: 3,
    },
    {
      name: 'lunch_program',
      label: 'Lunch Program',
      fieldType: 'select',
      entityType: 'Student',
      options: ['Free', 'Reduced', 'Paid'],
      required: false,
      displayOrder: 4,
    },
    {
      name: 'parent_volunteer',
      label: 'Parent Volunteer',
      fieldType: 'boolean',
      entityType: 'Student',
      required: false,
      displayOrder: 5,
    },
    {
      name: 'photo_permission',
      label: 'Photo/Media Permission',
      fieldType: 'boolean',
      entityType: 'Student',
      required: false,
      defaultValue: 'true',
      displayOrder: 6,
    },
  ];

  for (const field of customFields) {
    await prisma.customFieldDefinition.upsert({
      where: { name: field.name },
      update: field,
      create: field,
    });
  }

  // Create attendance codes
  const attendanceCodes = [
    {
      code: 'P',
      name: 'Present',
      description: 'Student is present',
      type: 'Present',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: false,
      isExcused: false,
      displayOrder: 1,
    },
    {
      code: 'A',
      name: 'Absent',
      description: 'Student is absent without excuse',
      type: 'Absent',
      countsAsPresent: false,
      countsAsAbsent: true,
      countsAsTardy: false,
      isExcused: false,
      displayOrder: 2,
    },
    {
      code: 'EA',
      name: 'Excused Absence',
      description: 'Student is absent with valid excuse',
      type: 'Absent',
      countsAsPresent: false,
      countsAsAbsent: true,
      countsAsTardy: false,
      isExcused: true,
      displayOrder: 3,
    },
    {
      code: 'T',
      name: 'Tardy',
      description: 'Student arrived late',
      type: 'Tardy',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: true,
      isExcused: false,
      displayOrder: 4,
    },
    {
      code: 'ET',
      name: 'Excused Tardy',
      description: 'Student arrived late with valid excuse',
      type: 'Tardy',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: true,
      isExcused: true,
      displayOrder: 5,
    },
    {
      code: 'FT',
      name: 'Field Trip',
      description: 'Student is on a school field trip',
      type: 'Present',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: false,
      isExcused: true,
      displayOrder: 6,
    },
    {
      code: 'ISS',
      name: 'In-School Suspension',
      description: 'Student is serving in-school suspension',
      type: 'Present',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: false,
      isExcused: false,
      displayOrder: 7,
    },
    {
      code: 'OSS',
      name: 'Out-of-School Suspension',
      description: 'Student is serving out-of-school suspension',
      type: 'Absent',
      countsAsPresent: false,
      countsAsAbsent: true,
      countsAsTardy: false,
      isExcused: true,
      displayOrder: 8,
    },
    {
      code: 'H',
      name: 'Half Day',
      description: 'Student attended for half day only',
      type: 'Present',
      countsAsPresent: true,
      countsAsAbsent: false,
      countsAsTardy: false,
      isExcused: true,
      displayOrder: 9,
    },
  ];

  for (const code of attendanceCodes) {
    await prisma.attendanceCode.upsert({
      where: { code: code.code },
      update: code,
      create: code,
    });
  }

  console.log('Custom fields and attendance codes seeded successfully!');
}

seedCustomFields()
  .catch((e) => {
    console.error('Error seeding custom fields:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });