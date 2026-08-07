import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', timestamp: new Date().toISOString() });
  }
});
