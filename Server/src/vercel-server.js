import app from './app.js'
import connectDB from './config/database.js'
import { initializeEmail } from './email/email.js'

let initialized = false
async function bootstrap() {
  if (initialized) return
  await connectDB()
  initializeEmail()
  initialized = true
}

export default async function handler(req, res) {
  await bootstrap()
  return app(req, res)
}


