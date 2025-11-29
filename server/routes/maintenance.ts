import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db/prisma'
import {
  maintenanceEventCreateSchema,
  maintenanceEventUpdateSchema,
  maintenanceEventBulkCreateSchema,
  maintenanceCompleteSchema,
} from '../validators/schemas'

export const maintenanceRouter = new Hono()

// Get all maintenance events (optionally filtered by vehicleId)
maintenanceRouter.get('/', async (c) => {
  const vehicleId = c.req.query('vehicleId')
  
  const events = await prisma.maintenanceEvent.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    orderBy: { scheduledDate: 'asc' },
  })
  
  return c.json(events)
})

// Get maintenance event by ID
maintenanceRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const event = await prisma.maintenanceEvent.findUnique({
    where: { id },
    include: { expenses: true },
  })
  
  if (!event) {
    return c.json({ error: 'Maintenance event not found' }, 404)
  }
  
  return c.json(event)
})

// Create maintenance event
maintenanceRouter.post(
  '/',
  zValidator('json', maintenanceEventCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const event = await prisma.maintenanceEvent.create({
      data,
    })
    
    return c.json(event, 201)
  }
)

// Bulk create maintenance events (for weekly checks)
maintenanceRouter.post(
  '/bulk',
  zValidator('json', maintenanceEventBulkCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const events = await prisma.maintenanceEvent.createMany({
      data,
    })
    
    // Fetch the created events
    const createdEvents = await prisma.maintenanceEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: data.length,
    })
    
    return c.json(createdEvents, 201)
  }
)

// Update maintenance event
maintenanceRouter.put(
  '/:id',
  zValidator('json', maintenanceEventUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    try {
      const event = await prisma.maintenanceEvent.update({
        where: { id },
        data,
      })
      return c.json(event)
    } catch (error) {
      return c.json({ error: 'Maintenance event not found' }, 404)
    }
  }
)

// Mark as complete
maintenanceRouter.patch(
  '/:id/complete',
  zValidator('json', maintenanceCompleteSchema),
  async (c) => {
    const id = c.req.param('id')
    const { completedMileage } = c.req.valid('json')
    
    try {
      const event = await prisma.maintenanceEvent.update({
        where: { id },
        data: {
          status: 'completed',
          completedDate: new Date().toISOString().split('T')[0],
          completedMileage,
        },
      })
      return c.json(event)
    } catch (error) {
      return c.json({ error: 'Maintenance event not found' }, 404)
    }
  }
)

// Delete maintenance event
maintenanceRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.maintenanceEvent.delete({
      where: { id },
    })
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Maintenance event not found' }, 404)
  }
})
