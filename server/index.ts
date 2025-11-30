import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { vehiclesRouter } from './routes/vehicles'
import { maintenanceRouter } from './routes/maintenance'
import { expensesRouter } from './routes/expenses'
import { budgetsRouter } from './routes/budgets'
import { prisma } from './db/prisma'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: '*',
  credentials: true,
}))

// Global error handler
app.onError((err, c) => {
  console.error('Server error:', err)
  
  // Handle Zod validation errors from zValidator
  if (err.message && err.message.includes('Validation')) {
    return c.json({ error: err.message }, 400)
  }
  
  return c.json({ error: err.message || 'Internal server error' }, 500)
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// API routes
const api = new Hono()
api.route('/vehicles', vehiclesRouter)
api.route('/maintenance', maintenanceRouter)
api.route('/expenses', expensesRouter)
api.route('/budgets', budgetsRouter)

app.route('/api', api)

// Serve static files from the built frontend
const distPath = join(process.cwd(), 'dist')

if (existsSync(distPath)) {
  console.log('📁 Serving frontend from:', distPath)
  
  // Serve static assets (JS, CSS, images)
  app.use('/assets/*', serveStatic({ root: './dist' }))
  
  // Serve favicon and other root static files  
  app.get('/favicon.ico', serveStatic({ root: './dist' }))
  app.get('/vite.svg', serveStatic({ root: './dist' }))
  
  // SPA fallback - serve index.html for all other non-API routes
  app.get('*', (c) => {
    // Skip API routes
    if (c.req.path.startsWith('/api')) {
      return c.json({ error: 'Not found' }, 404)
    }
    const indexPath = join(distPath, 'index.html')
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf-8')
      return c.html(html)
    }
    return c.json({ error: 'Frontend not found' }, 404)
  })
} else {
  console.log('⚠️ No dist folder found, serving API only')
}

const port = Number(process.env.PORT) || 3001
const hostname = process.env.HOSTNAME || process.env.HOST || '0.0.0.0'

const start = async () => {
  console.log('⏳ Warming up database connection...')
  const startTime = Date.now()
  
  try {
    await prisma.$connect()
    // Run actual queries to warm up the query engine for each model
    await Promise.all([
      prisma.vehicle.count(),
      prisma.maintenanceEvent.count(),
      prisma.expense.count(),
    ])
    console.log(`✅ Database ready in ${Date.now() - startTime}ms`)
  } catch (err) {
    console.error('❌ Database warmup failed:', err)
    // Continue anyway - queries will be slow but will work
  }
  
  serve({
    fetch: app.fetch,
    port,
    hostname,
  }, (info) => {
    console.log(`🚀 Server is listening on http://${hostname}:${info.port}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
