import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { reminderCreateSchema, reminderUpdateSchema } from '../validators/schemas'

export const remindersRouter = new Hono()

const completeSchema = z.object({
  lastCompletedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  lastCompletedMileage: z.number().int().min(0).optional().nullable(),
})

// GET / — list reminders, optional ?vehicleId= filter
remindersRouter.get('/', async (c) => {
  const vehicleId = c.req.query('vehicleId')

  const reminders = await prisma.recurringReminder.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: { createdAt: 'asc' },
  })

  return c.json(reminders)
})

// GET /:id — get single reminder
remindersRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const reminder = await prisma.recurringReminder.findUnique({ where: { id } })

  if (!reminder) {
    return c.json({ error: 'Reminder not found' }, 404)
  }

  return c.json(reminder)
})

// POST / — create reminder
remindersRouter.post(
  '/',
  zValidator('json', reminderCreateSchema),
  async (c) => {
    const data = c.req.valid('json')

    const reminder = await prisma.recurringReminder.create({ data })

    return c.json(reminder, 201)
  }
)

// PUT /:id — update reminder
remindersRouter.put(
  '/:id',
  zValidator('json', reminderUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    try {
      const reminder = await prisma.recurringReminder.update({ where: { id }, data })
      return c.json(reminder)
    } catch (_error) {
      return c.json({ error: 'Reminder not found' }, 404)
    }
  }
)

// PATCH /:id/toggle — toggle isActive
remindersRouter.patch('/:id/toggle', async (c) => {
  const id = c.req.param('id')

  const existing = await prisma.recurringReminder.findUnique({ where: { id } })

  if (!existing) {
    return c.json({ error: 'Reminder not found' }, 404)
  }

  const reminder = await prisma.recurringReminder.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  return c.json(reminder)
})

// PATCH /:id/complete — mark last completion
remindersRouter.patch(
  '/:id/complete',
  zValidator('json', completeSchema),
  async (c) => {
    const id = c.req.param('id')
    const { lastCompletedDate, lastCompletedMileage } = c.req.valid('json')

    const existing = await prisma.recurringReminder.findUnique({ where: { id } })

    if (!existing) {
      return c.json({ error: 'Reminder not found' }, 404)
    }

    const updateData: { lastCompletedDate: string, lastCompletedMileage?: number | null } = {
      lastCompletedDate: lastCompletedDate ?? new Date().toISOString().split('T')[0],
    }

    if (lastCompletedMileage !== undefined) {
      updateData.lastCompletedMileage = lastCompletedMileage
    }

    const reminder = await prisma.recurringReminder.update({
      where: { id },
      data: updateData,
    })

    return c.json(reminder)
  }
)

// DELETE /:id — delete reminder
remindersRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')

  try {
    await prisma.recurringReminder.delete({ where: { id } })
    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: 'Reminder not found' }, 404)
  }
})

// POST /:vehicleId/generate-events — auto-create MaintenanceEvents from active reminders
remindersRouter.post('/:vehicleId/generate-events', async (c) => {
  const vehicleId = c.req.param('vehicleId')

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } })

  if (!vehicle) {
    return c.json({ error: 'Vehicle not found' }, 404)
  }

  const activeReminders = await prisma.recurringReminder.findMany({
    where: { vehicleId, isActive: true },
  })

  type CreatedEvent = Awaited<ReturnType<typeof prisma.maintenanceEvent.create>>

  const createdEvents = await prisma.$transaction(async (tx) => {
    const events: CreatedEvent[] = []

    for (const reminder of activeReminders) {
      const existingOpenEvent = await tx.maintenanceEvent.findFirst({
        where: {
          vehicleId,
          category: reminder.category,
          status: { not: 'completed' },
        },
      })

      if (existingOpenEvent) {
        continue
      }

      // Calculate next due date/mileage
      let scheduledDate: string | null = null
      let scheduledMileage: number | null = null

      const today = new Date()

      if (reminder.recurrenceType === 'time' || reminder.recurrenceType === 'both') {
        if (reminder.timeInterval && reminder.timeUnit) {
          let base = today
          if (reminder.lastCompletedDate) {
            const parsed = new Date(reminder.lastCompletedDate)
            if (!isNaN(parsed.getTime())) {
              base = parsed
            }
          }
          const next = new Date(base)

          if (reminder.timeUnit === 'days') {
            next.setDate(next.getDate() + reminder.timeInterval)
          } else if (reminder.timeUnit === 'weeks') {
            next.setDate(next.getDate() + reminder.timeInterval * 7)
          } else if (reminder.timeUnit === 'months') {
            next.setMonth(next.getMonth() + reminder.timeInterval)
          } else if (reminder.timeUnit === 'years') {
            next.setFullYear(next.getFullYear() + reminder.timeInterval)
          }

          scheduledDate = next.toISOString().split('T')[0]
        }
      }

      if (reminder.recurrenceType === 'mileage' || reminder.recurrenceType === 'both') {
        if (reminder.mileageInterval) {
          const baseMileage = reminder.lastCompletedMileage ?? vehicle.currentOdometer
          scheduledMileage = baseMileage + reminder.mileageInterval
        }
      }

      const event = await tx.maintenanceEvent.create({
        data: {
          vehicleId,
          category: reminder.category,
          type: 'service',
          title: reminder.title,
          description: reminder.description ?? null,
          scheduledDate,
          scheduledMileage,
          status: 'scheduled',
        },
      })

      events.push(event)
    }

    return events
  })

  const status = createdEvents.length > 0 ? 201 : 200
  return c.json({ created: createdEvents.length, events: createdEvents }, status)
})
