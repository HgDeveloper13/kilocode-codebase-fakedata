import { IEmbeddingProvider } from '../interfaces/IEmbeddingProvider';
import { IVectorDBProvider } from '../interfaces/IVectorDBProvider';
import { OllamaProvider } from './embedding/OllamaProvider';
import { ONNXProvider } from './embedding/ONNXProvider';
import { OpenAICompatibleProvider } from './embedding/OpenAICompatibleProvider';
import { ChromaDBProvider } from './vector-db/ChromaDBProvider';
import { QdrantProvider } from './vector-db/QdrantProvider';
import { config } from '../../config/config';

export class ProviderFactory {
    public static createEmbeddingProvider(): IEmbeddingProvider {
        switch (config.embeddingProvider.toLowerCase()) {
            case 'ollama':
                return new OllamaProvider(config.ollamaUrl, config.modelName);
            case 'onnx':
                return new ONNXProvider();
            case 'openai':
                if (!config.openaiUrl || !config.openaiApiKey) {
                    throw new Error('OpenAI URL and API Key are required for OpenAICompatibleProvider');
                }
                return new OpenAICompatibleProvider(config.openaiUrl, config.openaiApiKey, config.modelName);
            default:
                throw new Error(`Unknown embedding provider: ${config.embeddingProvider}`);
        }
    }

    public static createVectorDBProvider(): IVectorDBProvider {
        switch (config.vectorDBProvider.toLowerCase()) {
            case 'qdrant':
                return new QdrantProvider(config.qdrantUrl, config.qdrantApiKey);
            case 'chroma':
                return new ChromaDBProvider(config.chromaUrl);
            default:
                throw new Error(`Unknown vector DB provider: ${config.vectorDBProvider}`);
        }
    }
}