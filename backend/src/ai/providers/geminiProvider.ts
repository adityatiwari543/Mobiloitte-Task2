import { IAIProvider, AICompletionOptions } from '../interfaces/aiProvider.interface.js';
import { env } from '../../config/env.js';

export class GeminiAIProvider implements IAIProvider {
  readonly providerName = 'google-gemini';

  async generateText(prompt: string, options?: AICompletionOptions): Promise<string> {
    if (!env.AI_API_KEY) {
      throw new Error('Gemini API key is not configured in environment (AI_API_KEY).');
    }

    const candidateModels = Array.from(
      new Set([env.AI_MODEL_NAME, 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'].filter(Boolean))
    );

    let lastError: Error | null = null;

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.AI_API_KEY}`;
        const body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options?.temperature ?? 0.4,
            maxOutputTokens: options?.maxTokens ?? 3000,
          },
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errText = await response.text();
          // If model not found (404) or overloaded (503), try next fallback model
          if (response.status === 404 || response.status === 503) {
            console.warn(`[GeminiAIProvider] Model ${model} returned ${response.status}, trying fallback...`);
            lastError = new Error(`Gemini API request failed (${response.status}): ${errText}`);
            continue;
          }
          throw new Error(`Gemini API request failed (${response.status}): ${errText}`);
        }

        const data = (await response.json()) as any;
        const parts = data.candidates?.[0]?.content?.parts || [];
        const textParts = parts.filter((p: any) => p && typeof p.text === 'string').map((p: any) => p.text);
        const candidateText = textParts.join('\n').trim();

        if (!candidateText) {
          throw new Error('No candidate content returned by Gemini.');
        }

        return candidateText;
      } catch (err: any) {
        lastError = err;
        // If it's a network or model-specific error, try next candidate
        if (candidateModels.indexOf(model) < candidateModels.length - 1) {
          continue;
        }
      }
    }

    throw lastError || new Error('Gemini API failed with all configured candidate models.');
  }
}
