import { IEmbeddingProvider } from "../../interfaces/IEmbeddingProvider";
import OpenAI from "openai";

export class OpenAICompatibleProvider implements IEmbeddingProvider {
  private openai: OpenAI;
  private model: string;

  constructor() {
    this.model = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-ada-002";
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE,
    });
  }

  async getEmbeddings(text: string | string[]): Promise<number[][]> {
    const response = await this.openai.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data.map((embedding) => embedding.embedding);
  }
}