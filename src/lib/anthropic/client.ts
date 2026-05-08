import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export const MODELS = {
  standard: 'claude-sonnet-4-5',
  advanced: 'claude-opus-4-5-20251101',
} as const
