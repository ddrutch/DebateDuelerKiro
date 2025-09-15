# TypeScript Strict Coding Rules

## Overview
This document defines strict TypeScript coding standards for all code generation and modifications in this project. These rules ensure type safety, maintainability, and compatibility with strict TypeScript configurations.

## Core Rules

### 1. Never Use `any`
- **NEVER** use the `any` type under any circumstances
- If a type is unknown, define a named interface or type alias instead
- Use `unknown` only when strictly necessary and always with type guards

```typescript
// ❌ BAD
function processData(data: any): any {
  return data.someProperty;
}

// ✅ GOOD
interface ProcessableData {
  someProperty: string;
  otherProperty?: number;
}

function processData(data: ProcessableData): string {
  return data.someProperty;
}
```

### 2. Explicit Type Annotations
- **ALL** function parameters must be explicitly typed
- **ALL** function return values must be explicitly typed
- **ALL** class properties must be explicitly typed

```typescript
// ❌ BAD
function calculate(x, y) {
  return x + y;
}

// ✅ GOOD
function calculate(x: number, y: number): number {
  return x + y;
}
```

### 3. Strict and Narrow Types
- Prefer specific types over broad ones
- Use union types when multiple specific types are valid
- Use literal types when values are constrained

```typescript
// ❌ BAD
interface Config {
  mode: string;
  count: number;
}

// ✅ GOOD
interface Config {
  mode: 'development' | 'production' | 'test';
  count: 1 | 2 | 3 | 4 | 5;
}
```

### 4. Unknown Type Handling
- Use `unknown` only when the type is truly unknown at compile time
- Always wrap `unknown` with type guards or safe casting
- Document why `unknown` is necessary

```typescript
// ✅ ACCEPTABLE when necessary
function processUnknownData(data: unknown): string {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
  if (typeof data === 'object' && data !== null && 'toString' in data) {
    return String(data);
  }
  throw new Error('Invalid data type');
}
```

### 5. Interface and Type Definitions
- Define interfaces for object shapes
- Use type aliases for complex union types or computed types
- Export types that might be used by other modules

```typescript
// ✅ GOOD
export interface StorageOperation<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: OperationMetadata;
}

export type StorageErrorCode = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR' 
  | 'SERIALIZATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN_ERROR';
```

### 6. Generic Type Parameters
- Use meaningful generic parameter names
- Provide constraints when appropriate
- Set default types when sensible

```typescript
// ❌ BAD
interface Container<T> {
  value: T;
}

// ✅ GOOD
interface Container<TValue = string> {
  value: TValue;
}

interface Repository<TEntity extends { id: string }> {
  findById(id: string): Promise<TEntity | null>;
  save(entity: TEntity): Promise<void>;
}
```

### 7. Error Handling Types
- Define specific error interfaces
- Use discriminated unions for different error types
- Include all necessary error context

```typescript
// ✅ GOOD
interface BaseError {
  code: string;
  message: string;
  timestamp: number;
}

interface NetworkError extends BaseError {
  code: 'NETWORK_ERROR';
  statusCode: number;
  retryable: boolean;
}

interface ValidationError extends BaseError {
  code: 'VALIDATION_ERROR';
  field: string;
  expectedType: string;
}

type ApplicationError = NetworkError | ValidationError;
```

## Compilation Requirements

### Strict Mode Compatibility
All generated code must compile successfully under these TypeScript compiler options:
- `"strict": true`
- `"noImplicitAny": true`
- `"strictNullChecks": true`
- `"strictFunctionTypes": true`
- `"noImplicitReturns": true`
- `"noImplicitThis": true`

### Verification Process
Before considering any code complete:
1. Run TypeScript compilation check: `npx tsc --noEmit --strict`
2. Fix all compilation errors
3. Ensure no `any` types are present
4. Verify all functions have explicit return types

## Common Patterns

### Async Function Types
```typescript
// ✅ GOOD
async function fetchData(url: string): Promise<ApiResponse> {
  const response = await fetch(url);
  return response.json() as ApiResponse;
}
```

### Event Handler Types
```typescript
// ✅ GOOD
interface EventHandler<TEvent = Event> {
  (event: TEvent): void;
}

function setupClickHandler(handler: EventHandler<MouseEvent>): void {
  document.addEventListener('click', handler);
}
```

### Configuration Objects
```typescript
// ✅ GOOD
interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly ssl?: boolean;
}

function createConnection(config: DatabaseConfig): Connection {
  // Implementation
}
```

## Enforcement

These rules are **mandatory** for all TypeScript code in this project. Code that violates these rules should be rejected and rewritten to comply with these standards.

### Code Review Checklist
- [ ] No `any` types present
- [ ] All function parameters explicitly typed
- [ ] All function return types explicitly typed
- [ ] All class properties explicitly typed
- [ ] Interfaces defined for object shapes
- [ ] Union types used appropriately
- [ ] Code compiles under strict mode
- [ ] Type guards used with `unknown`