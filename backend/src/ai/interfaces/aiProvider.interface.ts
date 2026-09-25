export interface AICompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface IAIProvider {
  readonly providerName: string;
  generateText(prompt: string, options?: AICompletionOptions): Promise<string>;
}
