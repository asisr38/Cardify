import type { VercelResponse } from '@vercel/node';

export const applyCors = (res: VercelResponse): void => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
};

export const handleOptions = (res: VercelResponse): boolean => {
  applyCors(res);
  res.status(204).end();
  return true;
};
