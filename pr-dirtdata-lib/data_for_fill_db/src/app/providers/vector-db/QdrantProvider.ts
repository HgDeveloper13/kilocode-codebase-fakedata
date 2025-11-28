import { QdrantClient } from "@qdrant/js-client-rest";
import { IVectorDBProvider } from "../../interfaces/IVectorDBProvider";
import { PointStruct } from "@qdrant/js-client-rest/dist/types/types";
import dotenv from 'dotenv';

dotenv.config();

export class QdrantProvider implements IVectorDBProvider {
    private client: QdrantClient;

    constructor() {
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL,
            apiKey: process.env.QDRANT_API_KEY,
        });
    }

    async init(collectionName: string, vectorSize: number): Promise<void> {
        const collections = await this.client.getCollections();
        const collectionExists = collections.collections.some(c => c.name === collectionName);

        if (!collectionExists) {
            await this.client.createCollection(collectionName, {
                vectors: { size: vectorSize, distance: 'Cosine' },
            });
            console.log(`Collection '${collectionName}' created.`);
        } else {
            console.log(`Collection '${collectionName}' already exists.`);
        }
    }

    async upsert(collectionName: string, points: PointStruct[]): Promise<void> {
        await this.client.upsert(collectionName, {
            wait: true,
            points: points,
        });
    }

    async search(collectionName: string, vector: number[], limit: number): Promise<any> {
        const result = await this.client.search(collectionName, {
            vector: vector,
            limit: limit,
        });
        return result;
    }
}