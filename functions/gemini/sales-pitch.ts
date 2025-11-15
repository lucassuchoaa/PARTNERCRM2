/**
 * Gemini AI Sales Pitch Generator API Endpoint
 *
 * Generates personalized sales pitches using AI
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, salesPitchSchema } from '../_middleware/validation';
import { GeminiSalesPitchRequest, GeminiSalesPitchResponse, JWTPayload } from '../../shared/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }

  if (!GEMINI_API_KEY) {
    return errorResponse('AI service not configured', 503, 'SERVICE_UNAVAILABLE');
  }

  await apiRateLimit(req, res, async () => {
    await requireAuth(async (req, res, user: JWTPayload) => {
      await validateBody(salesPitchSchema)(req, res, async (validatedData: GeminiSalesPitchRequest) => {
        try {
          const { productName, clientContext } = validatedData;

          const prompt = `Você é um especialista em vendas da Somapay. Crie um pitch de vendas persuasivo e profissional para o produto "${productName}".

${clientContext ? `Contexto do cliente: ${clientContext}` : ''}

O pitch deve incluir:
1. Abertura impactante
2. 3-4 benefícios principais
3. Diferencial competitivo
4. Call to action forte

Mantenha tom profissional mas acessível.`;

          const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: prompt
                }]
              }],
              generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
              }
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
          }

          const data = await response.json();

          const pitch = data.candidates?.[0]?.content?.parts?.[0]?.text ||
            `Olá! Gostaria de apresentar nosso produto ${productName}.

Com a Somapay, você oferece uma solução completa e moderna que simplifica processos, reduz custos e aumenta a satisfação dos colaboradores.

Principais benefícios:
• Implementação rápida e sem burocracia
• Economia de até 30% em custos operacionais
• Suporte especializado 24/7
• Plataforma intuitiva e segura

Vamos agendar uma demonstração?`;

          const result: GeminiSalesPitchResponse = {
            pitch
          };

          res.status(200).json(successResponse(result, 'Sales pitch generated successfully'));
        } catch (error: any) {
          console.error('Gemini API error:', error);
          return errorResponse(
            error.message || 'Failed to generate sales pitch',
            500,
            'AI_REQUEST_FAILED'
          );
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));
