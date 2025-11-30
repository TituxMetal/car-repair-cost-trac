import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { prisma } from '../db/prisma'
import { vehicleCreateSchema, vehicleUpdateSchema } from '../validators/schemas'

export const vehiclesRouter = new Hono()

// Get all vehicles
vehiclesRouter.get('/', async (c) => {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return c.json(vehicles)
})

// Get vehicle by ID
vehiclesRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      maintenanceEvents: true,
      expenses: true,
      budget: true,
    },
  })
  
  if (!vehicle) {
    return c.json({ error: 'Vehicle not found' }, 404)
  }
  
  return c.json(vehicle)
})

// Create vehicle
vehiclesRouter.post(
  '/',
  zValidator('json', vehicleCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    
    const vehicle = await prisma.vehicle.create({
      data,
    })
    
    return c.json(vehicle, 201)
  }
)

// Update vehicle
vehiclesRouter.put(
  '/:id',
  zValidator('json', vehicleUpdateSchema),
  async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    
    try {
      const vehicle = await prisma.vehicle.update({
        where: { id },
        data,
      })
      return c.json(vehicle)
    } catch (_error) {
      return c.json({ error: 'Vehicle not found' }, 404)
    }
  }
)

// Delete vehicle (cascade deletes related records)
vehiclesRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  
  try {
    await prisma.vehicle.delete({
      where: { id },
    })
    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: 'Vehicle not found' }, 404)
  }
})
