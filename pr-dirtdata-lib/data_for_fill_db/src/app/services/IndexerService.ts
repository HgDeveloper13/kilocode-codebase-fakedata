import * as fs from 'fs/promises';
import { IEmbeddingProvider } from '../interfaces/IEmbeddingProvider';
import { IVectorDBProvider } from '../interfaces/IVectorDBProvider';
import { IIndexerService } from '../interfaces/IIndexerService';

export class IndexerService implements IIndexerService {
    private embeddingProvider: IEmbeddingProvider;
    private vectorDBProvider: IVectorDBProvider;

    constructor(embeddingProvider: IEmbeddingProvider, vectorDBProvider: IVectorDBProvider) {
        this.embeddingProvider = embeddingProvider;
        this.vectorDBProvider = vectorDBProvider;
    }

    private splitLuaCodeIntoChunks(code: string): string[] {
        // Простая реализация на регулярных выражениях для разбивки по функциям.
        // Этот паттерн ищет объявления функций и разбивает код по ним.
        const functionPattern = /function\s+[\w\.:]+\s*\(.*\)[\s\S]*?end/g;
        const chunks = code.match(functionPattern);
        
        // Если функции не найдены, возвращаем весь код как один чанк.
        return chunks && chunks.length > 0 ? chunks : [code];
    }

    public async indexCode(filePath: string): Promise<void> {
        try {
            console.log(`Indexing file: ${filePath}`);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            
            const chunks = this.splitLuaCodeIntoChunks(fileContent);
            if (chunks.length === 0) {
                console.log(`No chunks found for file: ${filePath}`);
                return;
            }

            console.log(`Found ${chunks.length} chunks. Generating embeddings...`);
            const embeddings = await this.embeddingProvider.getEmbeddings(chunks);

            if (embeddings.length !== chunks.length) {
                throw new Error('Mismatch between number of chunks and embeddings');
            }

            const documents = chunks.map((chunk, index) => ({
                id: `${filePath}-${index}`,
                embedding: embeddings[index],
                metadata: {
                    filePath: filePath,
                    chunk: index,
                    content: chunk,
                },
            }));

            console.log(`Saving ${documents.length} documents to the vector database...`);
            await this.vectorDBProvider.save(documents);
            console.log(`Successfully indexed file: ${filePath}`);

        } catch (error) {
            console.error(`Failed to index file ${filePath}:`, error);
            throw error; // Пробрасываем ошибку выше для обработки в main
        }
    }
}