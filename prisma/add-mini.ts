import { PrismaClient } from '../generated/prisma'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({ url: 'file:prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Adding Mini Cooper...')

  // Create the Mini Cooper
  const vehicle = await prisma.vehicle.create({
    data: {
      make: 'Mini',
      model: 'Cooper Coupé S',
      year: 2012,
      vin: 'FAKE123VIN',
      licensePlate: 'FAKEPLATE',
      currentOdometer: 92500,
      purchaseDate: '2025-08-07',
      fuelType: 'gasoline',
      engineType: '1.6L Turbo 182ch',
    },
  })

  console.log(`✅ Created vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.id})`)

  // Create default weekly checks
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const scheduledDate = nextWeek.toISOString().split('T')[0]

  const weeklyChecks = [
    { category: 'oil-level-check', title: 'Weekly Oil Level Check', description: 'Check engine oil level' },
    { category: 'tire-pressure-check', title: 'Weekly Tire Pressure Check', description: 'Check tire pressure when cold' },
    { category: 'coolant-level-check', title: 'Weekly Coolant Level Check', description: 'Check coolant reservoir level' },
    { category: 'brake-fluid-check', title: 'Weekly Brake Fluid Check', description: 'Check brake fluid level' },
    { category: 'windshield-washer-check', title: 'Weekly Washer Fluid Check', description: 'Check washer fluid level' },
    { category: 'lights-check', title: 'Weekly Lights Check', description: 'Check all lights are working' },
  ]

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

  console.log('✅ Created 6 weekly maintenance checks')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
