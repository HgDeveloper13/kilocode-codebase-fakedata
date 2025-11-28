import { PointStruct } from "@qdrant/js-client-rest/dist/types/types";

export interface IVectorDBProvider {
    init(collectionName: string, vectorSize: number): Promise<void>;
    upsert(collectionName: string, points: PointStruct[]): Promise<void>;
    search(collectionName: string, vector: number[], limit: number): Promise<any>;
}