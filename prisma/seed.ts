import { PrismaClient } from '../generated/prisma'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create a sample vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      make: 'Mini',
      model: 'Cooper Coupé S',
      year: 2012,
      vin: 'WMWXC31030T000000',
      licensePlate: 'FAKEPLATE',
      currentOdometer: 92500,
      purchaseDate: '2025-07-08',
      fuelType: 'gasoline',
      engineType: '1.6L Turbo 182ch',
    },
  })

  console.log(`✅ Created vehicle: ${vehicle.make} ${vehicle.model}`)

  // Create default weekly checks
  const weeklyChecks = [
    {
      category: 'oil-level-check',
      title: 'Weekly Oil Level Check',
      description: 'Check engine oil level to prevent engine damage from low oil.',
    },
    {
      category: 'tire-pressure-check',
      title: 'Weekly Tire Pressure Check',
      description: 'Check tire pressure when cold. Proper pressure improves fuel efficiency.',
    },
    {
      category: 'coolant-level-check',
      title: 'Weekly Coolant Level Check',
      description: 'Check coolant reservoir level. Low coolant can cause overheating.',
    },
    {
      category: 'brake-fluid-check',
      title: 'Weekly Brake Fluid Check',
      description: 'Check brake fluid level in reservoir.',
    },
    {
      category: 'windshield-washer-check',
      title: 'Weekly Washer Fluid Check',
      description: 'Check and refill windshield washer fluid.',
    },
    {
      category: 'lights-check',
      title: 'Weekly Lights Check',
      description: 'Test all lights: headlights, brake lights, turn signals.',
    },
  ]

  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const scheduledDate = nextWeek.toISOString().split('T')[0]

  for (const check of weeklyChecks) {
    await prisma.maintenanceEvent.create({
      data: {
        vehicleId: vehicle.id,
        category: check.category,
        type: 'weekly-check',
        title: check.title,
        description: check.description,
        scheduledDate,
        status: 'scheduled',
      },
    })
  }

  console.log(`✅ Created ${weeklyChecks.length} weekly maintenance checks`)

  // Create a budget
  await prisma.budget.create({
    data: {
      vehicleId: vehicle.id,
      amount: 200,
      period: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
    },
  })

  console.log('✅ Created monthly budget')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
