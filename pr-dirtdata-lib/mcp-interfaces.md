# MCP Server Core Interfaces

This document defines the core TypeScript interfaces and data types for the MCP server.

## Basic Data Types

```typescript
/**
 * Represents a chunk of code with associated metadata.
 */
export interface Chunk {
  id: string;
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

/**
 * Represents a vector with its ID and associated metadata.
 */
export interface Vector {
  id: string;
  values: number[];
  metadata: {
    chunkId: string;
    filePath: string;
  };
}
```

## Core Providers

### IEmbeddingProvider

The `IEmbeddingProvider` is responsible for generating vector embeddings from text.

```typescript
/**
 * Interface for embedding providers.
 */
export interface IEmbeddingProvider {
  /**
   * Creates an embedding vector from a text chunk.
   * @param text The text to create an embedding for.
   * @returns A promise that resolves to the embedding vector (an array of numbers).
   */
  createEmbedding(text: string): Promise<number[]>;
}
```

### IVectorDBProvider

The `IVectorDBProvider` handles interactions with the vector database.

```typescript
/**
 * Interface for vector database providers.
 */
export interface IVectorDBProvider {
  /**
   * Adds multiple vectors to the database.
   * @param vectors An array of vectors to add.
   * @returns A promise that resolves when the operation is complete.
   */
  addVectors(vectors: Vector[]): Promise<void>;

  /**
   * Searches for vectors in the database that are similar to the given vector.
   * @param queryVector The vector to search with.
   * @param topK The number of similar vectors to return.
   * @returns A promise that resolves to an array of similar vectors.
   */
  search(queryVector: number[], topK: number): Promise<Vector[]>;
}
```

## Indexer Service

### IIndexerService

The `IIndexerService` orchestrates the indexing process, using the embedding and vector DB providers.

```typescript
/**
 * Interface for the indexing service.
 */
export interface IIndexerService {
  /**
   * The embedding provider used by the service.
   */
  embeddingProvider: IEmbeddingProvider;

  /**
   * The vector database provider used by the service.
   */
  vectorDBProvider: IVectorDBProvider;

  /**
   * Starts the indexing process for a given directory.
   * @param directoryPath The path to the directory to index.
   * @returns A promise that resolves when the indexing is complete.
   */
  startIndexing(directoryPath: string): Promise<void>;
}