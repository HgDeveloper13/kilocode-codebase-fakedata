import 'dotenv/config';
import { ProviderFactory } from './providers/ProviderFactory';
import { IndexerService } from './services/IndexerService';
import { config } from '../../config/config';
import * as fs from 'fs/promises';
import * as path from 'path';

async function main() {
    console.log('Starting indexing process...');

    try {
        const embeddingProvider = ProviderFactory.createEmbeddingProvider();
        const vectorDBProvider = ProviderFactory.createVectorDBProvider();
        const indexerService = new IndexerService(embeddingProvider, vectorDBProvider);

        const codeDirectory = path.resolve(process.cwd(), config.codeDirectory);
        console.log(`Scanning for .lua files in: ${codeDirectory}`);

        await indexFilesInDirectory(codeDirectory, indexerService);

        console.log('Indexing process completed successfully.');

    } catch (error) {
        console.error('An error occurred during the indexing process:', error);
        process.exit(1);
    }
}

async function indexFilesInDirectory(directory: string, indexer: IndexerService) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            // Игнорируем node_modules и другие скрытые директории
            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                await indexFilesInDirectory(fullPath, indexer);
            }
        } else if (path.extname(entry.name) === '.lua') {
            await indexer.indexCode(fullPath);
        }
    }
}

main();