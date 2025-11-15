/**
 * Gemini AI Ask API Endpoint (Gemini Proxy)
 *
 * Securely sends requests to Google Gemini API
 * API key is stored server-side only
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withCORS } from '../_middleware/cors';
import { withErrorHandler, successResponse, errorResponse } from '../_middleware/errorHandler';
import { requireAuth } from '../_middleware/auth';
import { apiRateLimit } from '../_middleware/rateLimit';
import { validateBody, geminiRequestSchema } from '../_middleware/validation';
import { GeminiRequest, GeminiResponse, JWTPayload } from '../../shared/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

if (!GEMINI_API_KEY) {
  console.error('⚠️  GEMINI_API_KEY not set in environment variables');
}

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
      await validateBody(geminiRequestSchema)(req, res, async (validatedData: GeminiRequest) => {
        try {
          const { message, context } = validatedData;

          const prompt = context
            ? `Contexto: ${context}\n\nPergunta do usuário: ${message}\n\nResponda de forma clara, objetiva e amigável em português. Foque em ajudar parceiros da Somapay com vendas e dúvidas sobre produtos financeiros.`
            : `Pergunta: ${message}\n\nResponda de forma clara, objetiva e amigável em português. Você é um assistente da Somapay ajudando parceiros com vendas.`;

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
                temperature: 0.7,
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

          const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui gerar uma resposta.';
          const tokens = data.usageMetadata?.totalTokenCount || 0;

          const result: GeminiResponse = {
            response: aiResponse,
            isFromAI: true,
            tokens
          };

          res.status(200).json(successResponse(result, 'AI response generated successfully'));
        } catch (error: any) {
          console.error('Gemini API error:', error);
          return errorResponse(
            error.message || 'Failed to generate AI response',
            500,
            'AI_REQUEST_FAILED'
          );
        }
      });
    })(req, res);
  });
}

export default withCORS(withErrorHandler(handler));
