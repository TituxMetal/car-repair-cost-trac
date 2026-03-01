import { Hono } from 'hono'
import { prisma } from '../db/prisma'
import { seedDemoData } from '../demo-data'

export const demoRouter = new Hono()

// POST /reset — wipe database and seed with demo data
demoRouter.post('/reset', async (c) => {
  const result = await seedDemoData(prisma)
  return c.json(result)
})
