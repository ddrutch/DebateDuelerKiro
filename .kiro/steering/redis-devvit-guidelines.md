# Redis Development Guidelines for Devvit

## Overview

This document provides comprehensive guidelines for working with Redis in Devvit applications, based on the official Devvit Redis documentation and best practices for game development and data storage.

## Core Redis Concepts in Devvit

### Data Storage Model
- **Everything is a String**: Redis stores all data as strings, but provides type-specific operations
- **Namespaced by Installation**: Each subreddit installation has isolated data - no cross-subreddit access
- **No Global State**: Each app installation maintains its own Redis database instance

### Supported Data Types
1. **Strings**: Basic key-value storage
2. **Numbers**: Atomic increment/decrement operations
3. **Hashes**: Collections of key-value pairs (recommended for complex objects)
4. **Sorted Sets**: Ordered collections with scores (perfect for leaderboards)
5. **Bitfields**: Efficient bit-level operations

## Performance Limits and Quotas

### Critical Limits (Per Installation)
- **Commands per second**: 1,000 max
- **Request size**: 5 MB max
- **Total storage**: 500 MB max

### Performance Implications
- Design for burst traffic patterns in gaming scenarios
- Implement request batching for high-frequency operations
- Use transactions for atomic multi-step operations

## Data Structure Recommendations

### Use Hashes for Complex Objects
```typescript
// ✅ RECOMMENDED: Use hashes for ghost data
await redis.hSet('ghost:abc123', {
  ghostId: 'abc123',
  playerId: 'player456',
  engineType: 'outrun',
  configId: '1min',
  createdAt: Date.now().toString(),
  recordingData: JSON.stringify(recording)
});

// ✅ Retrieve ghost metadata efficiently
const ghostData = await redis.hGetAll('ghost:abc123');
```

### Use Sorted Sets for Rankings and Time-Based Data
```typescript
// ✅ RECOMMENDED: Leaderboards with sorted sets
await redis.zAdd('leaderboard:outrun-1min', {
  member: 'player456',
  score: 125.5 // lap time in seconds
});

// ✅ Get top 10 players
const topPlayers = await redis.zRange('leaderboard:outrun-1min', 0, 9, { by: 'rank' });
```

### Avoid Simple Strings for Complex Data
```typescript
// ❌ AVOID: Storing complex objects as JSON strings
await redis.set('ghost:abc123', JSON.stringify(complexGhostObject));

// ✅ BETTER: Use hashes for structured data
await redis.hSet('ghost:abc123', {
  id: 'abc123',
  metadata: JSON.stringify(metadata),
  recording: JSON.stringify(recording)
});
```

## Key Naming Conventions

### Hierarchical Key Structure
```typescript
// ✅ RECOMMENDED: Clear, hierarchical naming
'ghost:${ghostId}'                    // Individual ghost data
'ghosts:${engineType}:${configId}'    // Ghost lists by configuration
'player:${playerId}:ghosts'           // Player's ghost list
'leaderboard:${engineType}:${configId}' // Configuration-specific leaderboards
'session:${sessionId}:data'           // Session data
'config:${configId}:settings'         // Configuration settings
```

### Key Naming Rules
- Use colons (`:`) as separators for hierarchy
- Keep keys under 250 characters
- Use consistent casing (prefer lowercase with hyphens)
- Include type prefixes for clarity

## Transaction Patterns

### Atomic Ghost Storage
```typescript
// ✅ RECOMMENDED: Use transactions for multi-step operations
const txn = await redis.watch('ghosts:outrun:1min');
await txn.multi();

// Store ghost data
await txn.hSet(`ghost:${ghostId}`, ghostData);

// Add to configuration list
await txn.hSet('ghosts:outrun:1min', ghostId, Date.now().toString());

// Add to player list
await txn.hSet(`player:${playerId}:ghosts`, ghostId, Date.now().toString());

// Execute atomically
await txn.exec();
```

### Error Handling in Transactions
```typescript
// ✅ RECOMMENDED: Proper transaction error handling
try {
  const txn = await redis.watch(watchKeys);
  await txn.multi();
  
  // ... transaction operations
  
  const result = await txn.exec();
  if (!result) {
    // Transaction was discarded due to watched key changes
    throw new Error('Transaction failed due to concurrent modification');
  }
} catch (error) {
  // Handle transaction failures gracefully
  console.error('Redis transaction failed:', error);
  // Implement fallback or retry logic
}
```

## Data Type Handling Best Practices

### String Serialization
```typescript
// ✅ RECOMMENDED: Explicit serialization handling
interface StoredGhostData {
  ghostId: string;
  createdAt: number;
  engineType: string;
  configId: string;
  recordingData: string; // JSON serialized
}

// Always handle JSON parsing with error handling
function parseGhostData(rawData: Record<string, string>): StoredGhostData | null {
  try {
    return {
      ghostId: rawData.ghostId,
      createdAt: parseInt(rawData.createdAt, 10),
      engineType: rawData.engineType,
      configId: rawData.configId,
      recordingData: rawData.recordingData
    };
  } catch (error) {
    console.error('Failed to parse ghost data:', error);
    return null;
  }
}
```

### Number Handling
```typescript
// ✅ RECOMMENDED: Explicit number conversion
const score = await redis.hGet('player:123', 'bestTime');
const numericScore = score ? parseFloat(score) : 0;

// ✅ Use Redis number operations when possible
await redis.hIncrBy('player:123', 'gamesPlayed', 1);
```

## List Operations and Arrays

### Hash-Based Lists (Recommended)
```typescript
// ✅ RECOMMENDED: Use hashes for list-like data with metadata
await redis.hSet('ghosts:outrun:1min', {
  [ghostId1]: Date.now().toString(),
  [ghostId2]: (Date.now() - 1000).toString()
});

// Retrieve and sort by timestamp
const ghostEntries = await redis.hGetAll('ghosts:outrun:1min');
const sortedGhosts = Object.entries(ghostEntries)
  .sort(([,a], [,b]) => parseInt(b, 10) - parseInt(a, 10))
  .map(([ghostId]) => ghostId);
```

### Avoid String-Based Arrays
```typescript
// ❌ AVOID: Storing arrays as JSON strings (hard to query/modify)
await redis.set('ghostList', JSON.stringify([ghost1, ghost2, ghost3]));

// ✅ BETTER: Use hashes or sorted sets
await redis.zAdd('ghostList', 
  { member: ghost1, score: timestamp1 },
  { member: ghost2, score: timestamp2 }
);
```

## Performance Optimization

### Batch Operations
```typescript
// ✅ RECOMMENDED: Use batch operations for multiple keys
const ghostData = await redis.mGet([
  'ghost:abc123',
  'ghost:def456',
  'ghost:ghi789'
]);

// ✅ Batch writes
await redis.mSet({
  'config:outrun:1min:maxGhosts': '10',
  'config:outrun:2min:maxGhosts': '15',
  'config:outrun:3min:maxGhosts': '20'
});
```

### Efficient Scanning
```typescript
// ✅ RECOMMENDED: Use hScan for large hashes
async function getAllGhosts(configKey: string): Promise<string[]> {
  const ghosts: string[] = [];
  let cursor = 0;
  
  do {
    const result = await redis.hScan(configKey, cursor);
    cursor = result.cursor;
    
    for (const { field } of result.fieldValues) {
      ghosts.push(field);
    }
  } while (cursor !== 0);
  
  return ghosts;
}
```

## Error Handling and Resilience

### Graceful Degradation
```typescript
// ✅ RECOMMENDED: Always provide fallbacks
async function getGhostData(ghostId: string): Promise<GhostData | null> {
  try {
    const data = await redis.hGetAll(`ghost:${ghostId}`);
    return parseGhostData(data);
  } catch (error) {
    console.error(`Failed to retrieve ghost ${ghostId}:`, error);
    return null; // Graceful degradation
  }
}
```

### Connection Resilience
```typescript
// ✅ RECOMMENDED: Implement retry logic for critical operations
async function saveGhostWithRetry(ghostData: GhostData, maxRetries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await redis.hSet(`ghost:${ghostData.ghostId}`, ghostData);
      return true;
    } catch (error) {
      console.error(`Ghost save attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        return false;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
    }
  }
  return false;
}
```

## Data Consistency Patterns

### Configuration Isolation
```typescript
// ✅ RECOMMENDED: Always include configuration context
function getGhostListKey(engineType: string, configId: string): string {
  return `ghosts:${engineType}:${configId}`;
}

function validateConfigurationMatch(ghostData: any, expectedEngine: string, expectedConfig: string): boolean {
  return ghostData.engineType === expectedEngine && ghostData.configId === expectedConfig;
}
```

### Data Validation
```typescript
// ✅ RECOMMENDED: Validate data structure before storage
interface GhostDataValidator {
  validateGhostData(data: unknown): data is StoredGhostData;
  sanitizeGhostId(id: unknown): string | null;
  validateConfigurationKey(engineType: string, configId: string): boolean;
}

const validator: GhostDataValidator = {
  validateGhostData(data): data is StoredGhostData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as any).ghostId === 'string' &&
      typeof (data as any).engineType === 'string' &&
      typeof (data as any).configId === 'string'
    );
  },
  
  sanitizeGhostId(id): string | null {
    return typeof id === 'string' && id.trim() !== '' ? id.trim() : null;
  },
  
  validateConfigurationKey(engineType, configId): boolean {
    return (
      typeof engineType === 'string' && engineType.trim() !== '' &&
      typeof configId === 'string' && configId.trim() !== ''
    );
  }
};
```

## Memory and Storage Management

### Data Lifecycle Management
```typescript
// ✅ RECOMMENDED: Implement data cleanup strategies
async function cleanupOldGhosts(configKey: string, maxGhosts: number): Promise<void> {
  const allGhosts = await redis.hGetAll(configKey);
  const ghostEntries = Object.entries(allGhosts);
  
  if (ghostEntries.length > maxGhosts) {
    // Sort by timestamp (oldest first)
    ghostEntries.sort(([,a], [,b]) => parseInt(a, 10) - parseInt(b, 10));
    
    const toDelete = ghostEntries.slice(0, ghostEntries.length - maxGhosts);
    
    const txn = await redis.watch(configKey);
    await txn.multi();
    
    for (const [ghostId] of toDelete) {
      await txn.hDel(configKey, ghostId);
      await txn.del(`ghost:${ghostId}`);
    }
    
    await txn.exec();
  }
}
```

### Storage Efficiency
```typescript
// ✅ RECOMMENDED: Compress large data when possible
function compressRecordingData(recording: any): string {
  // Implement compression for large recording data
  // Consider removing redundant data, using deltas, etc.
  return JSON.stringify(recording);
}

// ✅ Use expiration for temporary data
await redis.set('session:temp:123', sessionData);
await redis.expire('session:temp:123', 3600); // 1 hour expiration
```

## Common Anti-Patterns to Avoid

### ❌ Don't Use Redis as a Message Queue
Redis in Devvit doesn't support pub/sub or list operations like LPUSH/RPOP.

### ❌ Don't Store Large Binary Data
The 5MB request limit makes Redis unsuitable for large files.

### ❌ Don't Ignore Namespace Isolation
Remember that each subreddit installation is completely isolated.

### ❌ Don't Use Complex Nested JSON
Prefer flat hash structures over deeply nested JSON objects.

### ❌ Don't Forget Error Handling
Always handle Redis operation failures gracefully.

## Integration with CentralStorageService

When working with the existing CentralStorageService, ensure:

1. **Type Safety**: Always validate data types when retrieving from Redis
2. **Array Handling**: Use the coercion methods to handle Redis's string-based storage
3. **Configuration Isolation**: Maintain strict separation between different game configurations
4. **Error Recovery**: Implement fallback mechanisms for storage failures

This steering document should be referenced whenever implementing Redis-based storage solutions in the Devvit gaming application.