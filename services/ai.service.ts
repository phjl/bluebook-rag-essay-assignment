import { streamText, generateText, Message, embed, StreamTextResult, ToolSet } from "ai";
import { createOllama } from "ollama-ai-provider";
import { createClient } from "@/lib/supabase/server";
import { EssayData, VectorEmbedding } from "@/types";

class AIService {
  readonly LLM_MODEL_NAME = process.env.OLLAMA_LLM_MODEL || "gemma3:1b";
  readonly EMBEDDING_MODEL_NAME =
    process.env.OLLAMA_EMBEDDING_MODEL || "jmorgan/gte-small";
  readonly OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434/api";
  readonly OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || "";

  private ollamaProvider;

  constructor() {
    this.ollamaProvider = this.getOllamaProvider();
  }

  private getOllamaProvider() {
    return createOllama({
      baseURL: this.OLLAMA_API_URL,
      headers: {
        Authorization: `Bearer ${this.OLLAMA_API_KEY}`,
      }
    });
  }

  async generateEmbedding(input: string): Promise<VectorEmbedding> {
    const { embedding } = await embed({
      model: this.ollamaProvider.embedding(this.EMBEDDING_MODEL_NAME),
      value: input,
    });
    return embedding;
  }

  async doRagSearch(embedding: VectorEmbedding, limit: number=1): Promise<EssayData[]> {
    const supabase = await createClient();

    const { data: essays, error } = await supabase
      .rpc("match_essays", {
        embedding,
        match_threshold: 0.2, // Higher is stricter
      })
      .select("title, url, content")
      .limit(limit);

    if(error) throw error

    if (essays && essays.length > 0)
      console.info(
        "RAG context retrieved:",
        essays.map((essay) => essay.title).join(" - ")
      );
    else console.info("No essays found.");

    return essays ?? [];
  }

  async streamText(promptMessages: Message[]): Promise<StreamTextResult<ToolSet, string>> {
    return streamText({
      messages: promptMessages,
      model: this.ollamaProvider(this.LLM_MODEL_NAME),
      temperature: 0,
      maxTokens: 512,
      onError({ error }) {
        console.error(error);
      },
    });
  }

  async generateText(promptMessages: Message[]): Promise<string> {
    const result = await generateText({
        messages: promptMessages,
        model: this.ollamaProvider(this.LLM_MODEL_NAME),
        temperature: 0,
        maxTokens: 512,
    });
    return result.text;
  }
}

const aiService = new AIService();
export default aiService;