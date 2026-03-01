import type { PrismaClient } from '../generated/prisma'

// ── Date helpers (module-private) ────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toDateStr(d)
}

const daysFromNow = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

const firstOfMonth = () => {
  const d = new Date()
  d.setDate(1)
  return toDateStr(d)
}

// ── Vehicle ──────────────────────────────────────────────────────────

export const getDemoVehicle = () => ({
  make: 'Mini',
  model: 'Cooper Coupé S',
  year: 2012,
  vin: 'WMWXC31030T000000',
  licensePlate: 'FAKEPLATE',
  currentOdometer: 92500,
  purchaseDate: '2025-07-08',
  fuelType: 'gasoline',
  engineType: '1.6L Turbo 182ch',
})

// ── Weekly check definitions ─────────────────────────────────────────

const weeklyCheckDefs = [
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

// ── Demo data builder ────────────────────────────────────────────────

type DemoEvent = {
  _key: string
  vehicleId: string
  category: string
  type: string
  title: string
  description?: string
  scheduledDate?: string
  scheduledMileage?: number
  completedDate?: string
  completedMileage?: number
  status: string
  appointmentTime?: string
  appointmentPlace?: string
  appointmentReason?: string
  isRecurring?: boolean
  recurrenceType?: string
  recurrenceValue?: number
}

type DemoExpense = {
  _eventKey: string | null
  vehicleId: string
  date: string
  garageName?: string
  description?: string
  partsCost: number
  laborCost: number
  otherCost: number
  totalCost: number
}

export const getDemoData = (vehicleId: string) => {
  // ── Completed services (5) ──────────────────────────────────────
  const completedServices: DemoEvent[] = [
    {
      _key: 'oil-change',
      vehicleId,
      category: 'oil-change',
      type: 'service',
      title: 'Oil Change',
      description: 'Full synthetic oil change with filter replacement.',
      scheduledDate: daysAgo(92),
      completedDate: daysAgo(90),
      completedMileage: 89000,
      status: 'completed',
    },
    {
      _key: 'tire-rotation',
      vehicleId,
      category: 'tires',
      type: 'service',
      title: 'Tire Rotation',
      description: 'Rotated all four tires for even wear.',
      scheduledDate: daysAgo(62),
      completedDate: daysAgo(60),
      completedMileage: 90500,
      status: 'completed',
    },
    {
      _key: 'brake-pads',
      vehicleId,
      category: 'brakes',
      type: 'part-replacement',
      title: 'Front Brake Pads Replacement',
      description: 'Replaced front brake pads and inspected rotors.',
      scheduledDate: daysAgo(47),
      completedDate: daysAgo(45),
      completedMileage: 91000,
      status: 'completed',
    },
    {
      _key: 'inspection',
      vehicleId,
      category: 'inspection',
      type: 'service',
      title: 'Annual Inspection',
      description: 'Full vehicle inspection — passed with no issues.',
      scheduledDate: daysAgo(32),
      completedDate: daysAgo(30),
      completedMileage: 91500,
      status: 'completed',
    },
    {
      _key: 'air-filter',
      vehicleId,
      category: 'filters',
      type: 'part-replacement',
      title: 'Air Filter Replacement',
      description: 'Replaced engine air filter.',
      scheduledDate: daysAgo(22),
      completedDate: daysAgo(20),
      completedMileage: 92000,
      status: 'completed',
    },
  ]

  // ── Completed weekly checks (24 = 4 weeks × 6 types) ──────────
  const completedWeeklyChecks: DemoEvent[] = [28, 21, 14, 7].flatMap(
    (daysBack, weekIndex) =>
      weeklyCheckDefs.map((check, checkIndex) => ({
        _key: `check-w${weekIndex}-c${checkIndex}`,
        vehicleId,
        category: check.category,
        type: 'weekly-check' as const,
        title: check.title,
        description: check.description,
        scheduledDate: daysAgo(daysBack),
        completedDate: daysAgo(daysBack),
        status: 'completed',
        isRecurring: true,
        recurrenceType: 'weekly',
        recurrenceValue: 1,
      })),
  )

  // ── Scheduled weekly checks (6 — next week) ───────────────────
  const scheduledWeeklyChecks: DemoEvent[] = weeklyCheckDefs.map(
    (check, i) => ({
      _key: `check-next-${i}`,
      vehicleId,
      category: check.category,
      type: 'weekly-check' as const,
      title: check.title,
      description: check.description,
      scheduledDate: daysFromNow(7),
      status: 'scheduled',
      isRecurring: true,
      recurrenceType: 'weekly',
      recurrenceValue: 1,
    }),
  )

  // ── Scheduled services (2) ─────────────────────────────────────
  const scheduledServices: DemoEvent[] = [
    {
      _key: 'coolant-flush-scheduled',
      vehicleId,
      category: 'fluids',
      type: 'service',
      title: 'Coolant Flush',
      description: 'Complete coolant system flush and refill.',
      scheduledDate: daysFromNow(45),
      status: 'scheduled',
    },
    {
      _key: 'tire-alignment-scheduled',
      vehicleId,
      category: 'tires',
      type: 'service',
      title: 'Tire Alignment',
      description: 'Four-wheel alignment check and adjustment.',
      scheduledDate: daysFromNow(60),
      status: 'scheduled',
      appointmentTime: '10:00',
      appointmentPlace: 'Mini Service Center',
      appointmentReason: 'Slight pull to the left noticed',
    },
  ]

  // ── Overdue event (1) ──────────────────────────────────────────
  const overdueEvents: DemoEvent[] = [
    {
      _key: 'wiper-overdue',
      vehicleId,
      category: 'other',
      type: 'part-replacement',
      title: 'Wiper Blade Replacement',
      description: 'Replace front wiper blades — streaking in rain.',
      scheduledDate: daysAgo(5),
      status: 'overdue',
    },
  ]

  const events = [
    ...completedServices,
    ...completedWeeklyChecks,
    ...scheduledWeeklyChecks,
    ...scheduledServices,
    ...overdueEvents,
  ]

  // ── Expenses (7) ───────────────────────────────────────────────
  const expenses: DemoExpense[] = [
    {
      _eventKey: 'oil-change',
      vehicleId,
      date: daysAgo(90),
      garageName: 'Quick Lube Express',
      description: 'Full synthetic oil change + filter',
      partsCost: 55,
      laborCost: 30,
      otherCost: 0,
      totalCost: 85,
    },
    {
      _eventKey: 'tire-rotation',
      vehicleId,
      date: daysAgo(60),
      garageName: 'TirePro Center',
      description: 'Tire rotation service',
      partsCost: 0,
      laborCost: 120,
      otherCost: 0,
      totalCost: 120,
    },
    {
      _eventKey: 'brake-pads',
      vehicleId,
      date: daysAgo(45),
      garageName: 'Mini Service Center',
      description: 'Front brake pads + rotor inspection',
      partsCost: 220,
      laborCost: 100,
      otherCost: 20,
      totalCost: 340,
    },
    {
      _eventKey: 'inspection',
      vehicleId,
      date: daysAgo(30),
      garageName: 'Mini Service Center',
      description: 'Annual vehicle inspection',
      partsCost: 0,
      laborCost: 90,
      otherCost: 0,
      totalCost: 90,
    },
    {
      _eventKey: 'air-filter',
      vehicleId,
      date: daysAgo(20),
      garageName: 'AutoZone',
      description: 'Engine air filter replacement',
      partsCost: 25,
      laborCost: 10,
      otherCost: 0,
      totalCost: 35,
    },
    {
      _eventKey: null,
      vehicleId,
      date: daysAgo(15),
      description: 'Annual parking permit renewal',
      partsCost: 0,
      laborCost: 0,
      otherCost: 180,
      totalCost: 180,
    },
    {
      _eventKey: null,
      vehicleId,
      date: daysAgo(3),
      garageName: 'Splash & Shine',
      description: 'Full car wash with interior cleaning',
      partsCost: 0,
      laborCost: 0,
      otherCost: 25,
      totalCost: 25,
    },
  ]

  // ── Budget ─────────────────────────────────────────────────────
  const budget = {
    vehicleId,
    amount: 200,
    period: 'monthly',
    startDate: firstOfMonth(),
  }

  // ── Reminders (5) ──────────────────────────────────────────────
  const reminders = [
    {
      vehicleId,
      category: 'oil-change',
      title: 'Oil Change Reminder',
      description: 'Change oil every 10,000 km or 3 months.',
      recurrenceType: 'both',
      mileageInterval: 10000,
      timeInterval: 3,
      timeUnit: 'months',
      lastCompletedDate: daysAgo(90),
      lastCompletedMileage: 89000,
      isActive: true,
    },
    {
      vehicleId,
      category: 'tires',
      title: 'Tire Rotation Reminder',
      description: 'Rotate tires every 6 months.',
      recurrenceType: 'time',
      timeInterval: 6,
      timeUnit: 'months',
      lastCompletedDate: daysAgo(60),
      lastCompletedMileage: 90500,
      isActive: true,
    },
    {
      vehicleId,
      category: 'brakes',
      title: 'Brake Inspection Reminder',
      description: 'Inspect brakes every 20,000 km or 12 months.',
      recurrenceType: 'both',
      mileageInterval: 20000,
      timeInterval: 12,
      timeUnit: 'months',
      lastCompletedDate: daysAgo(45),
      lastCompletedMileage: 91000,
      isActive: true,
    },
    {
      vehicleId,
      category: 'fluids',
      title: 'Coolant Flush Reminder',
      description: 'Flush coolant system every 2 years.',
      recurrenceType: 'time',
      timeInterval: 2,
      timeUnit: 'years',
      isActive: true,
    },
    {
      vehicleId,
      category: 'filters',
      title: 'Air Filter Reminder',
      description: 'Replace air filter every 15,000 km.',
      recurrenceType: 'mileage',
      mileageInterval: 15000,
      lastCompletedDate: daysAgo(20),
      lastCompletedMileage: 92000,
      isActive: true,
    },
  ]

  return { events, expenses, budget, reminders }
}

// ── Atomic seeding function ──────────────────────────────────────────

export const seedDemoData = async (prismaClient: PrismaClient) => {
  const result = await prismaClient.$transaction(async (tx) => {
    // 1. Delete all vehicles (cascades to events, expenses, budget, reminders)
    await tx.vehicle.deleteMany()

    // 2. Create vehicle
    const vehicle = await tx.vehicle.create({ data: getDemoVehicle() })

    // 3. Create events, build key → id map
    const { events, expenses, budget, reminders } = getDemoData(vehicle.id)
    const keyToId = new Map<string, string>()

    for (const { _key, ...eventData } of events) {
      const created = await tx.maintenanceEvent.create({ data: eventData })
      keyToId.set(_key, created.id)
    }

    // 4. Create expenses with resolved eventIds
    for (const { _eventKey, ...expenseData } of expenses) {
      const eventId = _eventKey ? keyToId.get(_eventKey) ?? null : null
      await tx.expense.create({ data: { ...expenseData, eventId } })
    }

    // 5. Create budget
    await tx.budget.create({ data: budget })

    // 6. Create reminders
    for (const reminder of reminders) {
      await tx.recurringReminder.create({ data: reminder })
    }

    return {
      vehicle,
      counts: {
        events: events.length,
        expenses: expenses.length,
        reminders: reminders.length,
      },
    }
  })

  return result
}
