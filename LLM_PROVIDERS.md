# LLM Provider Guide

Portforge Cyber supports the following LLM providers. You bring your own API key — we do not provide LLM access.

## Supported Providers

| Provider | Models | API Key URL |
|---|---|---|
| **Anthropic Claude** | claude-3-5-sonnet, claude-3-opus, claude-3-haiku | [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI** | gpt-4o, gpt-4-turbo, gpt-4, gpt-3.5-turbo | [platform.openai.com](https://platform.openai.com) |
| **Google Gemini** | gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash | [aistudio.google.com](https://aistudio.google.com) |
| **NVIDIA NIM** | mixtral-8x7b, llama-3.1-8b, llama-3.1-70b | [build.nvidia.com](https://build.nvidia.com) |
| **Groq** | mixtral-8x7b-32768, llama3-70b-8192, llama3-8b-8192 | [console.groq.com](https://console.groq.com) |
| **Moonshot (Kimi)** | moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k | [platform.moonshot.cn](https://platform.moonshot.cn) |
| **Z-ai (GLM)** | glm-4-flash, glm-4, glm-4-plus | [open.bigmodel.cn](https://open.bigmodel.cn) |
| **Minimax** | minimax-01, minimaturi-text-01 | [platform.minimaxi.com](https://platform.minimaxi.com) |

## Getting started

1. Create an account with your chosen provider
2. Generate an API key from their console
3. Paste the key into Portforge at **Settings → LLM Configuration**
4. Select the model you want to use
5. Click **Test Connection** to verify

## Notes

- **API keys are stored locally** in your browser using `localStorage`. They never leave your device.
- **Self-hosted NIM**: If using NVIDIA NIM with a custom endpoint, enter the base URL (e.g. `https://your-nim-endpoint.com/v1`) in the Custom Endpoint field.
- **Custom proxies**: For Google Gemini, you can also specify a custom endpoint if you're routing through a proxy.
