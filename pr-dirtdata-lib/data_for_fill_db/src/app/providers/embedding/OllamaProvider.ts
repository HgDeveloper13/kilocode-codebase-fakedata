import { IEmbeddingProvider } from "../../interfaces/IEmbeddingProvider";
import ollama from "ollama";

export class OllamaProvider implements IEmbeddingProvider {
  private host: string;
  private model: string;

  constructor() {
    this.host = process.env.OLLAMA_HOST || "http://localhost:11434";
    this.model = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";
  }

  async getEmbeddings(text: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(text) ? text : [text];
    const embeddings: number[][] = [];

    for (const t of texts) {
      const response = await ollama.embeddings({
        model: this.model,
        prompt: t,
        options: {
          host: this.host,
        },
      });
      embeddings.push(response.embedding);
    }

    return embeddings;
  }
}