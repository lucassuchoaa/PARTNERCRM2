import { Router, Request, Response } from 'express';

const router = Router();

// POST - Receber métricas de Web Vitals
router.post('/web-vitals', (req: Request, res: Response) => {
  // Apenas loga as métricas (opcional)
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vitals:', req.body);
  }
  
  // Retorna sucesso
  res.json({
    success: true,
    message: 'Métricas recebidas',
    timestamp: new Date().toISOString()
  });
});

export default router;
