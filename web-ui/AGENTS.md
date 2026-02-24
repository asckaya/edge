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

The Web UI is designed to be exported as a static site (`next export`) and served by the Cloudflare Worker via `env.ASSETS`.

- **Output Path**: `web-ui/out`
- **Dynamic Configuration**: The generated URL reflects the parameters parsed by the Worker's `fetch` handler.

## Field Name Standardization

Ensure all components (especially `NodeModal.tsx`) use schema-compliant field names:
- Use `type` instead of `protocol`.
- Use `skip-cert-verify` instead of `insecure`.
- Use nested `ws-opts`, `grpc-opts`, and `reality-opts`.
