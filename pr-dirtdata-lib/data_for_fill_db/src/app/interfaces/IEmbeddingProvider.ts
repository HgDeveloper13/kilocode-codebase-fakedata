export interface IEmbeddingProvider {
  getEmbeddings(text: string | string[]): Promise<number[][]>;
}