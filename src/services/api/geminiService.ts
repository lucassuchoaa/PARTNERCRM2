/**
 * Gemini AI Service (Secure Backend Version)
 *
 * Replaces direct Gemini API calls with secure backend proxy
 */

import { apiClient } from './client';
import { GeminiRequest, GeminiResponse, GeminiSalesPitchRequest, GeminiSalesPitchResponse } from '../../../shared/types';

/**
 * Ask Gemini AI a question via backend API (secure)
 */
export async function askGemini(message: string, context?: string): Promise<GeminiResponse> {
  try {
    const requestData: GeminiRequest = {
      message,
      context
    };

    const response = await apiClient.post<{ success: boolean; data: GeminiResponse }>('/gemini/ask', requestData);
    return response.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to get AI response';
    throw new Error(message);
  }
}

/**
 * Generate sales pitch using AI via backend API
 */
export async function generateSalesPitch(productName: string, clientContext?: string): Promise<string> {
  try {
    const requestData: GeminiSalesPitchRequest = {
      productName,
      clientContext
    };

    const response = await apiClient.post<{ success: boolean; data: GeminiSalesPitchResponse }>('/gemini/sales-pitch', requestData);
    return response.data.data.pitch;
  } catch (error: any) {
    console.error('Failed to generate sales pitch:', error);

    // Fallback to default pitch
    return `Olá! Gostaria de apresentar nosso produto ${productName}.

Com a Somapay, você oferece uma solução completa e moderna que simplifica processos, reduz custos e aumenta a satisfação dos colaboradores.

Principais benefícios:
• Implementação rápida e sem burocracia
• Economia de até 30% em custos operacionais
• Suporte especializado 24/7
• Plataforma intuitiva e segura

Vamos agendar uma demonstração?`;
  }
}

export default {
  askGemini,
  generateSalesPitch
};
