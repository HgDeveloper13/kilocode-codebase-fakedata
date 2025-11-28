import { InferenceSession, Tensor } from 'onnxruntime-node';
import { Tokenizer } from 'tokenizers';
import { IEmbeddingProvider } from '../../interfaces/IEmbeddingProvider';

export class ONNXProvider implements IEmbeddingProvider {
  private session: InferenceSession | null = null;
  private tokenizer: Tokenizer | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    const modelPath = process.env.ONNX_MODEL_PATH;
    const tokenizerPath = process.env.ONNX_TOKENIZER_PATH;

    if (!modelPath || !tokenizerPath) {
      throw new Error('ONNX_MODEL_PATH and ONNX_TOKENIZER_PATH must be set in the environment variables.');
    }

    this.session = await InferenceSession.create(modelPath);
    this.tokenizer = await Tokenizer.fromFile(tokenizerPath);
  }

  async getEmbeddings(text: string | string[]): Promise<number[][]> {
    if (!this.session || !this.tokenizer) {
      throw new Error('ONNXProvider is not initialized.');
    }

    const texts = Array.isArray(text) ? text : [text];
    const encodings = await this.tokenizer.encodeAll(texts);

    const embeddings: number[][] = [];

    for (const encoding of encodings) {
      const ids = encoding.getIds();
      const attentionMask = encoding.getAttentionMask();

      const tensorIds = new Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]);
      const tensorAttentionMask = new Tensor('int64', BigInt64Array.from(attentionMask.map(BigInt)), [1, attentionMask.length]);

      const feeds = {
        'input_ids': tensorIds,
        'attention_mask': tensorAttentionMask,
      };
      
      const results = await this.session.run(feeds);
      const embedding = results.last_hidden_state.data as Float32Array;
      
      embeddings.push(Array.from(embedding));
    }

    return embeddings;
  }
}