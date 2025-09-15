# No Test Files Policy

## Overview
Do not create standalone test files or testing scripts in the project root or anywhere in the codebase during implementation tasks.

## Guidelines

### What NOT to do:
- Do not create files like `test-*.js`, `*.test.js`, or similar testing scripts
- Do not create temporary verification files in the project root
- Do not add standalone testing utilities outside of the existing test framework

### What TO do instead:
- Verify functionality through TypeScript compilation checks
- Use existing test frameworks if tests are specifically required by a task
- Focus on implementing the actual functionality rather than ad-hoc testing
- Let the user test the implementation through the actual application

### Rationale
- Keeps the codebase clean and focused
- Avoids cluttering the project with temporary files
- Maintains consistency with existing project structure
- Allows users to control their own testing approach

## Exceptions
This policy applies to implementation tasks. If a task specifically calls for creating tests within the existing test framework, that is acceptable.