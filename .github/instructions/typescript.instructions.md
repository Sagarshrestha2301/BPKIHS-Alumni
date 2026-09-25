---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Instructions

## General

- Use strict TypeScript configuration
- Prefer `type` over `interface` for simple object types
- Use `interface` for object shapes that need to be extended
- Avoid `any` — use `unknown` or proper types
- Use `const` assertions for literal types
- Enable `exactOptionalPropertyTypes` in tsconfig

## Naming

- Use PascalCase for types and interfaces
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Prefix boolean variables with `is`, `has`, `can`, `should`
- Suffix event handlers with `Handler`, `on<Event>`

## Imports

- Use `@/*` alias for src imports
- Group imports: external, internal, relative
- Use type-only imports for types: `import type { ... }`

## Error Handling

- Use Result types for fallible operations
- Throw errors for truly exceptional cases
- Use Zod schemas for validation at boundaries

## React/Next.js

- Use Server Components by default
- Mark Client Components with `"use client"`
- Use `React.FC` sparingly; prefer function components
- Pass props as destructured parameters

## Database

- Use Prisma types: `import type { Prisma } from '@prisma/client'`
- Define Zod schemas that mirror Prisma models
- Use `Prisma.TransactionClient` for transactions