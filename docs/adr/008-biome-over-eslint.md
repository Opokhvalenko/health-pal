# ADR-008: Biome 2 over ESLint + Prettier

## Status
Accepted

## Context
ESLint + Prettier is the traditional JavaScript linting setup, but it requires multiple packages, plugins, and config files. Biome is a single tool that handles both linting and formatting with significantly faster execution.

## Decision
Use Biome 2 as the sole linter and formatter. Configuration: single quotes, space indentation, 100-character line width, recommended rules enabled.

## Consequences
- **Positive:** Single config file (`biome.json`), single dependency
- **Positive:** 10-50x faster than ESLint + Prettier
- **Positive:** Consistent formatting and linting in one pass
- **Negative:** Smaller plugin ecosystem than ESLint
- **Negative:** Some React Native specific rules may not be available
