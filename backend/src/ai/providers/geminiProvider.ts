import { IAIProvider, AICompletionOptions } from '../interfaces/aiProvider.interface.js';
import { env } from '../../config/env.js';

export class GeminiAIProvider implements IAIProvider {
  readonly providerName = 'google-gemini';

  async generateText(prompt: string, options?: AICompletionOptions): Promise<string> {
    if (!env.AI_API_KEY) {
      throw new Error('Gemini API key is not configured in environment (AI_API_KEY).');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL_NAME}:generateContent?key=${env.AI_API_KEY}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.4,
        maxOutputTokens: options?.maxTokens ?? 800,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API request failed (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as any;
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('No candidate content returned by Gemini.');
    }

    return candidateText;
  }
}
