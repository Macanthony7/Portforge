import type { LLMProvider } from '@/types'

export interface ProviderModel {
  id: string
  name: string
  maxTokens: number
  description: string
}

export interface ProviderConfig {
  name: string
  baseUrl: string
  models: ProviderModel[]
  requireCustomEndpoint?: boolean
}

export const PROVIDER_CONFIGS: Record<LLMProvider, ProviderConfig> = {
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8192, description: 'Best balance of speed and capability' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096, description: 'Highest capability, slower' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096, description: 'Fastest, most affordable' },
    ],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', maxTokens: 4096, description: 'Multimodal, fast and capable' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096, description: 'Reliable workhorse' },
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192, description: 'Legacy but reliable' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, description: 'Fast, most affordable' },
    ],
  },
  google: {
    name: 'Google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', maxTokens: 8192, description: 'Fast, experimental' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', maxTokens: 8192, description: 'Best quality' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', maxTokens: 8192, description: 'Fast and affordable' },
    ],
  },
  nvidia: {
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    requireCustomEndpoint: true,
    models: [
      { id: 'mistralai/mixtral-8x7b-instruct-v0.1', name: 'Mixtral 8x7B', maxTokens: 4096, description: 'Balanced performance' },
      { id: 'meta/llama-3.1-8b-instruct', name: 'Llama 3.1 8B', maxTokens: 4096, description: 'Fast, lightweight' },
      { id: 'meta/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', maxTokens: 4096, description: 'High capability' },
    ],
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', maxTokens: 32768, description: 'Long context' },
      { id: 'llama3-70b-8192', name: 'Llama 3 70B', maxTokens: 8192, description: 'High capability' },
      { id: 'llama3-8b-8192', name: 'Llama 3 8B', maxTokens: 8192, description: 'Fast, affordable' },
    ],
  },
  moonshot: {
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot v1 8K', maxTokens: 8192, description: 'Short context' },
      { id: 'moonshot-v1-32k', name: 'Moonshot v1 32K', maxTokens: 32768, description: 'Medium context' },
      { id: 'moonshot-v1-128k', name: 'Moonshot v1 128K', maxTokens: 128000, description: 'Long context' },
    ],
  },
  'z-ai': {
    name: 'Z-ai (GLM)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-flash', name: 'GLM-4 Flash', maxTokens: 4096, description: 'Fast, affordable' },
      { id: 'glm-4', name: 'GLM-4', maxTokens: 8192, description: 'Balanced' },
      { id: 'glm-4-plus', name: 'GLM-4 Plus', maxTokens: 8192, description: 'Highest capability' },
    ],
  },
  minimax: {
    name: 'Minimax',
    baseUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'minimax-01', name: 'MiniMax-01', maxTokens: 4096, description: 'Flagship model' },
      { id: 'minimax-text-01', name: 'MiniMax Text-01', maxTokens: 4096, description: 'Text optimized' },
    ],
  },
}

export function getModelsForProvider(provider: LLMProvider): ProviderModel[] {
  return PROVIDER_CONFIGS[provider]?.models || []
}

export function getProviderName(provider: LLMProvider): string {
  return PROVIDER_CONFIGS[provider]?.name || provider
}

// LocalStorage helpers for API key
const API_KEY_PREFIX = 'portforge_apikey_'

export function getStoredApiKey(provider: LLMProvider): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(`${API_KEY_PREFIX}${provider}`) || ''
  } catch {
    return ''
  }
}

export function storeApiKey(provider: LLMProvider, apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${API_KEY_PREFIX}${provider}`, apiKey)
}

export function clearAllApiKeys(): void {
  if (typeof window === 'undefined') return
  Object.keys(PROVIDER_CONFIGS).forEach(key => {
    localStorage.removeItem(`${API_KEY_PREFIX}${key}`)
  })
}
