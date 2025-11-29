import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { vehiclesRouter } from './routes/vehicles'
import { maintenanceRouter } from './routes/maintenance'
import { expensesRouter } from './routes/expenses'
import { budgetsRouter } from './routes/budgets'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: '*', // Allow all origins in development
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

const port = Number(process.env.PORT) || 3001
console.log(`🚀 Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
