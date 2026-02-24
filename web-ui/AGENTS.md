# AGENTS.md — Web UI (Next.js) Context

This directory contains the frontend for the Edge Subscription Generator. It is built with Next.js and provides a graphical interface for managing subscriptions and building proxy nodes.

## Technology Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Components**: Lucide React (Icons), Radix UI (Headless components)
- **Logic**: React Hooks (State management for subscriptions and node builder)

## Key Components (`src/components/`)

- **SubscriptionPanel.tsx**: Manages the list of subscription providers (Airport name and URL).
- **NodeModal.tsx**: The "React Node Builder" — a visual form to build proxy nodes (VLESS, VMess, TUIC, etc.) following the Zod schema defined in the root `src/types.ts`.
- **ActionBox.tsx**: Handles the generation and display of the Final Worker URL.

## Main Page (`src/app/page.tsx`)

Assembles the components and manages the global state:
- `subscriptions`: Array of `{id, name, url}`
- `proxies`: Array of `ProxyNode` (built using `NodeModal`)

## Integration with Worker

The Web UI is served by Cloudflare Assets. To prevent the Web UI's `index.html` from intercepting the root API path (`/`), the deployment pipeline moves all assets into a `ui/` subdirectory.

- **URL Path**: `domain.com/ui/`
- **Output Path**: `web-ui/out/ui` (after build step move)
- **Base Path**: Configured with `basePath: '/ui'` to match the URL structure.
- **Worker's Role**: The Worker only handles the canonical redirect from `/ui` to `/ui/`. All other UI asset requests are handled natively by Cloudflare's asset binding.
- **Conversion API**: The generated configuration points back to the root path (`/`).

## Field Name Standardization

Ensure all components (especially `NodeModal.tsx`) use schema-compliant field names:
- Use `type` instead of `protocol`.
- Use `skip-cert-verify` instead of `insecure`.
- Use nested `ws-opts`, `grpc-opts`, and `reality-opts`.
