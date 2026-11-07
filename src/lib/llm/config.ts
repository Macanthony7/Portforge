import type { LLMProvider } from '@/types'

export interface ProviderConfig {
  name: string
  apiKeyEnv: string
  baseUrlEnv: string
  defaultBaseUrl: string
  models: string[]
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic-compatible',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    baseUrlEnv: 'ANTHROPIC_BASE_URL',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      'claude-sonnet-4-20250514',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
    ],
  },
  openai: {
    name: 'OpenAI-compatible',
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrlEnv: 'OPENAI_BASE_URL',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
  },
}

export function getProviderName(provider: LLMProvider): string {
  return PROVIDER_CONFIGS[provider]?.name || provider
}

export function getSuggestedModels(provider: LLMProvider): string[] {
  return PROVIDER_CONFIGS[provider]?.models || []
}
