import { Router, Request, Response } from 'express';
import { adminGetLatestDigest } from '../firebase/firestore-admin';
import { runDigestAgent } from '../ai/digest-agent';

const router = Router();

// GET /api/digest/latest
router.get('/latest', async (_req: Request, res: Response) => {
  try {
    const result = await adminGetLatestDigest();
    if (!result.success) return res.status(404).json(result);
    return res.json({ success: true, data: result.data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// POST /api/digest/generate  — manual trigger (useful for testing)
router.post('/generate', async (_req: Request, res: Response) => {
  try {
    const result = await runDigestAgent();
    if (!result.success) return res.status(500).json(result);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

export default router;
