import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding healthcare database...')

  // ---- Departments ----
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { name: 'General Medicine' },
      update: {},
      create: { name: 'General Medicine', description: 'General health consultations and check-ups' },
    }),
    prisma.department.upsert({
      where: { name: 'Cardiology' },
      update: {},
      create: { name: 'Cardiology', description: 'Heart and cardiovascular system' },
    }),
    prisma.department.upsert({
      where: { name: 'Orthopedics' },
      update: {},
      create: { name: 'Orthopedics', description: 'Bones, joints, and musculoskeletal system' },
    }),
    prisma.department.upsert({
      where: { name: 'Dermatology' },
      update: {},
      create: { name: 'Dermatology', description: 'Skin, hair, and nail conditions' },
    }),
    prisma.department.upsert({
      where: { name: 'Pediatrics' },
      update: {},
      create: { name: 'Pediatrics', description: 'Healthcare for children and adolescents' },
    }),
    prisma.department.upsert({
      where: { name: 'ENT' },
      update: {},
      create: { name: 'ENT', description: 'Ear, nose, and throat specialist' },
    }),
  ])
  console.log(`Created ${departments.length} departments`)

  // ---- Admin User ----
  const adminPassword = await hash('Admin@123456', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      name: 'Clinic Admin',
      email: 'admin@clinic.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '+91 98765 43210',
    },
  })
  console.log('Admin user created:', adminUser.email)

  // ---- Doctors ----
  const doctorPassword = await hash('Doctor@123456', 12)

  const doctorUser1 = await prisma.user.upsert({
    where: { email: 'dr.sharma@clinic.com' },
    update: {},
    create: {
      name: 'Dr. Rajesh Sharma',
      email: 'dr.sharma@clinic.com',
      password: doctorPassword,
      role: 'DOCTOR',
      phone: '+91 98765 11111',
    },
  })

  await prisma.doctor.upsert({
    where: { userId: doctorUser1.id },
    update: {},
    create: {
      userId: doctorUser1.id,
      specialization: 'General Medicine',
      qualifications: ['MBBS', 'MD (General Medicine)'],
      experience: 15,
      consultationFee: 80000, // ₹800
      bio: 'Senior consultant with 15 years of experience in general medicine and preventive healthcare.',
      departmentId: departments[0].id,
      schedule: {
        mon: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
        tue: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
        wed: [{ start: '09:00', end: '13:00' }],
        thu: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
        fri: [{ start: '09:00', end: '13:00' }, { start: '16:00', end: '20:00' }],
        sat: [{ start: '09:00', end: '13:00' }],
      },
    },
  })

  const doctorUser2 = await prisma.user.upsert({
    where: { email: 'dr.patel@clinic.com' },
    update: {},
    create: {
      name: 'Dr. Anita Patel',
      email: 'dr.patel@clinic.com',
      password: doctorPassword,
      role: 'DOCTOR',
      phone: '+91 98765 22222',
    },
  })

  await prisma.doctor.upsert({
    where: { userId: doctorUser2.id },
    update: {},
    create: {
      userId: doctorUser2.id,
      specialization: 'Cardiology',
      qualifications: ['MBBS', 'DM (Cardiology)'],
      experience: 12,
      consultationFee: 120000, // ₹1200
      bio: 'Interventional cardiologist with expertise in preventive cardiology and cardiac rehabilitation.',
      departmentId: departments[1].id,
      schedule: {
        mon: [{ start: '10:00', end: '14:00' }, { start: '17:00', end: '20:00' }],
        tue: [{ start: '10:00', end: '14:00' }],
        wed: [{ start: '10:00', end: '14:00' }, { start: '17:00', end: '20:00' }],
        thu: [{ start: '10:00', end: '14:00' }],
        fri: [{ start: '10:00', end: '14:00' }, { start: '17:00', end: '20:00' }],
        sat: [{ start: '10:00', end: '13:00' }],
      },
    },
  })

  console.log('Doctors created')

  // ---- Staff User ----
  const staffPassword = await hash('Staff@123456', 12)
  await prisma.user.upsert({
    where: { email: 'staff@clinic.com' },
    update: {},
    create: {
      name: 'Reception Staff',
      email: 'staff@clinic.com',
      password: staffPassword,
      role: 'STAFF',
      phone: '+91 98765 33333',
    },
  })
  console.log('Staff user created')

  // ---- Demo Patient ----
  const patientPassword = await hash('Patient@123456', 12)
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient@demo.com' },
    update: {},
    create: {
      name: 'Amit Kumar',
      email: 'patient@demo.com',
      password: patientPassword,
      role: 'PATIENT',
      phone: '+91 98765 44444',
    },
  })

  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      address: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      emergencyContact: 'Priya Kumar',
      emergencyPhone: '+91 98765 55555',
    },
  })
  console.log('Demo patient created')

  // ---- Common Medicines ----
  const medicines = [
    { name: 'Paracetamol', genericName: 'Acetaminophen', type: 'tablet', strength: '500mg', manufacturer: 'Cipla' },
    { name: 'Amoxicillin', genericName: 'Amoxicillin', type: 'capsule', strength: '500mg', manufacturer: 'Sun Pharma' },
    { name: 'Omeprazole', genericName: 'Omeprazole', type: 'capsule', strength: '20mg', manufacturer: 'Dr Reddys' },
    { name: 'Azithromycin', genericName: 'Azithromycin', type: 'tablet', strength: '500mg', manufacturer: 'Cipla' },
    { name: 'Cetirizine', genericName: 'Cetirizine HCl', type: 'tablet', strength: '10mg', manufacturer: 'Sun Pharma' },
    { name: 'Metformin', genericName: 'Metformin HCl', type: 'tablet', strength: '500mg', manufacturer: 'USV' },
    { name: 'Amlodipine', genericName: 'Amlodipine besylate', type: 'tablet', strength: '5mg', manufacturer: 'Cipla' },
    { name: 'Pantoprazole', genericName: 'Pantoprazole', type: 'tablet', strength: '40mg', manufacturer: 'Alkem' },
    { name: 'Ibuprofen', genericName: 'Ibuprofen', type: 'tablet', strength: '400mg', manufacturer: 'Cipla' },
    { name: 'Dolo 650', genericName: 'Paracetamol', type: 'tablet', strength: '650mg', manufacturer: 'Micro Labs' },
    { name: 'Cough Syrup', genericName: 'Dextromethorphan', type: 'syrup', strength: '100ml', manufacturer: 'Cipla' },
    { name: 'Betadine', genericName: 'Povidone Iodine', type: 'cream', strength: '5%', manufacturer: 'Win Medicare' },
  ]

  for (const med of medicines) {
    await prisma.medicine.upsert({
      where: { id: med.name.toLowerCase().replace(/\s/g, '-') },
      update: {},
      create: med,
    })
  }
  console.log(`Created ${medicines.length} medicines`)

  // ---- Default Settings ----
  const defaultSettings = [
    { key: 'business_hours', value: { start: '09:00', end: '21:00' } },
    { key: 'slot_duration', value: 30 },
    { key: 'consultation_fee', value: 50000 },
    { key: 'gst_rate', value: 0.18 },
    { key: 'currency', value: 'INR' },
    { key: 'timezone', value: 'Asia/Kolkata' },
    { key: 'appointment_buffer', value: 5 },
    { key: 'max_advance_booking_days', value: 30 },
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    })
  }
  console.log('Default settings created')

  console.log('\n--- Seed completed! ---')
  console.log('\nLogin credentials:')
  console.log('  Admin:   admin@clinic.com / Admin@123456')
  console.log('  Doctor:  dr.sharma@clinic.com / Doctor@123456')
  console.log('  Doctor:  dr.patel@clinic.com / Doctor@123456')
  console.log('  Staff:   staff@clinic.com / Staff@123456')
  console.log('  Patient: patient@demo.com / Patient@123456')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
