import aiService from "@/services/ai.service";
import { Message } from "ai";
import { EssayData } from "@/types";

export async function POST(req: Request) {
  const { query } = await req.json();

  const embedding = await aiService.generateEmbedding(query);
  const context = await aiService.doRagSearch(embedding, 1);

  if(context.length < 1)
    return new Response('No match found')

  const promptMessages = [buildPrompt(context[0])];
  const aiReply = await aiService.generateText(promptMessages);

  return new Response(aiReply)
}

function buildPrompt(essayData: EssayData): Message {
  return {
    id: "system",
    role: "system",
    content: `
    You are an AI assistant tasked with summarizing essays by Paul Graham
    concisely and accurately. Given the following essay, generate
    a summary that captures the key points while avoiding unnecessary
    details. Ensure neutrality and refrain from interpreting beyond the
    provided text.
    
    Format your answers as Markdown.

    Essay:
    ${essayData.content}
    `,
  };
}
