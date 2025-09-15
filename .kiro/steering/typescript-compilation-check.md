# TypeScript Compilation Check

## Overview
Any time you modify TypeScript files in this project, you MUST verify that the TypeScript compilation still passes without errors.

## Rules

### Mandatory Compilation Check
- **ALWAYS** run TypeScript compilation check after modifying any `.ts` files
- **NEVER** consider a task complete until TypeScript compilation passes
- **VERIFY** compilation both for individual files and the entire project

### Compilation Commands
Use these commands to check TypeScript compilation:

```bash
# Check entire game project
npx tsc --noEmit --project game/tsconfig.json

# Check individual file (faster for debugging)
npx tsc --noEmit path/to/file.ts --skipLibCheck

# Skip library checks for faster compilation during development
npx tsc --noEmit --project game/tsconfig.json --skipLibCheck
```

### Error Handling
- **Fix compilation errors immediately** - don't leave broken TypeScript
- **Address type safety issues** - use proper types instead of `any` when possible
- **Import missing dependencies** - ensure all required imports are present
- **Check for typos** in property names and method calls

### Common Issues to Watch For
- Missing imports for interfaces and types
- Incorrect property names or method signatures
- Type mismatches (e.g., `undefined` vs `null`)
- Iterator compatibility issues (use `Array.from()` for Map/Set iterations)
- Optional chaining (`?.`) for potentially undefined properties

### Before Completing Tasks
1. Run TypeScript compilation check
2. Fix any compilation errors
3. Verify the specific files you modified compile correctly
4. Only then mark the task as complete

### Performance Tip
Use `--skipLibCheck` flag during development to speed up compilation, but run full compilation before final verification.

## Rationale
- Maintains code quality and type safety
- Prevents runtime errors from type mismatches
- Ensures the codebase remains maintainable
- Catches issues early in the development process