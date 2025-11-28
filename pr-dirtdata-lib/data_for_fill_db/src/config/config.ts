import dotenv from 'dotenv';
import path from 'path';

// Загружаем переменные окружения из .env файла в корне проекта
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface IConfig {
    embeddingProvider: string;
    vectorDBProvider: string;
    codeDirectory: string;
    qdrantUrl: string;
    qdrantApiKey?: string;
    chromaUrl: string;
    ollamaUrl: string;
    openaiUrl?: string;
    openaiApiKey?: string;
    modelName: string;
}

export const config: IConfig = {
    embeddingProvider: process.env.EMBEDDING_PROVIDER || 'ollama',
    vectorDBProvider: process.env.VECTOR_DB_PROVIDER || 'qdrant',
    codeDirectory: process.env.CODE_DIRECTORY || './',
    qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
    qdrantApiKey: process.env.QDRANT_API_KEY,
    chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
    ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    openaiUrl: process.env.OPENAI_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    modelName: process.env.MODEL_NAME || 'all-minilm'
};