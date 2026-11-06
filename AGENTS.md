<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- moxie-docs:start -->
## Moxie Docs Agent Guidance

Before editing Macanthony7/Portforge, use the Moxie Docs MCP server for live repository conventions, documentation patterns, gaps, and verified commands. The **moxie-docs** skill (`.claude/skills/moxie-docs/`) has the full edit-then-document workflow - follow it when changing code.

When your Moxie Docs token serves more than one repository, pass `repository: "Macanthony7/Portforge"` in every Moxie Docs tool call from this repo so the context targets Macanthony7/Portforge.
<!-- moxie-docs:end -->
