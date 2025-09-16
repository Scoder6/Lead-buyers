import express from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import { createLimiter, updateLimiter } from './lib/rateLimit.js';

console.log("loaded DATABASE_URL:", process.env.DATABASE_URL);

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Database connection
const connectionString = process.env.DATABASE_URL || '';
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}
const client = postgres(connectionString);
const db = drizzle(client);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Handle shutdown
const shutdown = async () => {
  console.log('Shutting down server...');
  await client.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
