import { serveStatic } from 'hono/bun'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { vehiclesRouter } from './routes/vehicles'
import { maintenanceRouter } from './routes/maintenance'
import { expensesRouter } from './routes/expenses'
import { budgetsRouter } from './routes/budgets'
import { remindersRouter } from './routes/reminders'
import { prisma, initDatabase } from './db/prisma'
import { existsSync } from 'fs'
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
api.route('/reminders', remindersRouter)

app.route('/api', api)

// Serve static files from the built frontend
const distPath = join(process.cwd(), 'dist')

const hasDist = existsSync(distPath)

if (!hasDist) {
  console.log('⚠️ No dist folder found, serving API only')
}

if (hasDist) {
  console.log('📁 Serving frontend from:', distPath)
  
  // Serve static assets (JS, CSS, images)
  app.use('/assets/*', serveStatic({ root: './dist' }))
  
  // Serve favicon and other root static files  
  app.get('/favicon.ico', serveStatic({ root: './dist' }))
  app.get('/vite.svg', serveStatic({ root: './dist' }))
  
  // SPA fallback - serve index.html for all other non-API routes
  app.get('*', async (c) => {
    // Skip API routes
    if (c.req.path.startsWith('/api')) {
      return c.json({ error: 'Not found' }, 404)
    }
    const indexPath = join(distPath, 'index.html')
    if (existsSync(indexPath)) {
      try {
        const file = Bun.file(indexPath)
        const html = await file.text()
        return c.html(html)
      } catch (err) {
        console.error('Failed to read index.html:', err)
        return c.json({ error: 'Failed to load frontend' }, 500)
      }
    }
    return c.json({ error: 'Frontend not found' }, 404)
  })
}

const port = Number(process.env.PORT) || 3001
const hostname = process.env.HOSTNAME || process.env.HOST || '0.0.0.0'
const isProduction = process.env.NODE_ENV === 'production'

let server: ReturnType<typeof Bun.serve> | null = null

const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...')
  
  if (server) {
    server.stop()
    console.log('✅ Server stopped')
  }
  
  try {
    await prisma.$disconnect()
    console.log('✅ Database disconnected')
  } catch (err) {
    console.error('❌ Error disconnecting database:', err)
  }
  
  process.exit(0)
}

// Handle graceful shutdown signals
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

const start = async () => {
  console.log('⏳ Initializing database...')
  const startTime = Date.now()
  
  try {
    // Ensure database directory exists and initialize schema
    await initDatabase()
    
    await prisma.$connect()
    // Run actual queries to warm up the query engine for each model
    await Promise.all([
      prisma.vehicle.count(),
      prisma.maintenanceEvent.count(),
      prisma.expense.count(),
    ])
    console.log(`✅ Database ready in ${Date.now() - startTime}ms`)
  } catch (err) {
    console.error('❌ Database initialization failed:', err)
    // In production, exit if database fails to initialize
    if (isProduction) {
      console.error('💀 Exiting due to database failure in production')
      process.exit(1)
    }
    // In development, continue anyway for API-only mode
    console.log('⚠️ Continuing in API-only mode...')
  }
  
  // Use Bun's native serve instead of @hono/node-server
  try {
    server = Bun.serve({
      fetch: app.fetch,
      port,
      hostname,
    })
    
    console.log(`🚀 Server is listening on http://${hostname}:${server.port}`)
  } catch (err) {
    console.error('❌ Failed to start server:', err)
    throw err
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
