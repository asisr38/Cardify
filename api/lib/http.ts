import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from './cors.js';

export const requireMethod = (
  req: VercelRequest,
  res: VercelResponse,
  method: string,
): boolean => {
  if (req.method === method) {
    return true;
  }
  applyCors(res);
  res.status(405).json({ error: 'Method not allowed' });
  return false;
};

export const readJsonBody = <T>(req: VercelRequest): T => {
  if (req.body === undefined || req.body === null) {
    throw new Error('Empty body');
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }
  return req.body as T;
};

export const sendError = (
  res: VercelResponse,
  status: number,
  message: string,
  code?: string,
): void => {
  applyCors(res);
  res.status(status).json(code ? { error: message, code } : { error: message });
};

export const sendJson = (res: VercelResponse, status: number, payload: unknown): void => {
  applyCors(res);
  res.status(status).json(payload);
};
