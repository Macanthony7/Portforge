# Portforge Documentation

Welcome to the Portforge documentation. Use the links below to navigate.

---

## Guides

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation, first run, creating your first project |
| [LLM Providers](./llm-providers.md) | OpenAI-compatible and Anthropic-compatible styles, server env vars, gateway setup, adding a new style |
| [CVSS v3.1 Calculator](./cvss-calculator.md) | Metric reference, severity ratings, programmatic usage |
| [Cloud Setup](./cloud-setup.md) | Optional Supabase integration for hosted deployments |
| [Contributing](./contributing.md) | Dev setup, architecture, conventions, PR process |

## Reference

| Document | Description |
|----------|-------------|
| [API Reference](./api-reference.md) | All internal APIs: LLMClient, db.ts, CVSS, templates, prompts, types |

---

## Quick Links

- **Run locally:** `npm install && npm run dev` → [http://localhost:3000](http://localhost:3000)
- **Configure an LLM:** set `OPENAI_API_KEY` / `OPENAI_BASE_URL` or `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL` on the server, then pick that style in Settings → [LLM Providers](./llm-providers.md)
- **GitHub Issues:** [github.com/Macanthony7/Portforge/issues](https://github.com/Macanthony7/Portforge/issues)
- **Discussions:** [github.com/Macanthony7/Portforge/discussions](https://github.com/Macanthony7/Portforge/discussions)
