import aiService from "@/services/ai.service";
import { Message } from "ai";
import { EssayData } from "@/types";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const lastMessage = messages[messages.length - 1].content;

  const embedding = await aiService.generateEmbedding(lastMessage);
  const context = await aiService.doRagSearch(embedding, 3);

  const promptMessages = buildPrompt(messages, context);
  const aiReplyStream = await aiService.streamText(promptMessages);

  return aiReplyStream.toTextStreamResponse();
}

function buildPrompt(messages: Message[], context: EssayData[]): Message[] {
  const systemMessage: Message = {
    id: "system",
    role: "system",
    content: `
    You are an expert on the writings of Paul Graham who's purpose is to educate others about his essays.
    You're a stickler for the rules and give your answers in a very particular structure.
    - You give short and precise answers
    - Your answers should all be connected to the provided essays. Don't make things up 
    - Format your answers as Markdown
    - Explicitly cite the essays your reference and put proper footnotes at the end of your response.
    
    The footnotes section should look like this:
    **References:**
    [1] “Essay Title 1”
    [2] “Essay Title 2”
    [3] “Essay Title 3”
    `,
  };

  const promptMessages = [systemMessage, ...messages];

  if (context.length < 1) return promptMessages;

  const contextMessage: Message = {
    id: "context",
    role: "system",
    content: `
    Read the essays below to answer any future questions.
    When you see [STOP] you've come to the ends of list of essays.

    Include a list of these essays at the beginning of every answer from now on.
    It can look like this:
    - [Essay Title 1](Essay URL)
    - [Essay Title 2](Essay URL)
    - [Essay Title 3](Essay URL)

    ESSAYS:
    -------
    ${context
      .map(
        (essay) =>
          `Title: ${essay.title}\nURL: ${essay.url}\nContent: ${essay.content}`
      )
      .join("\n\n")}
    [STOP]
    `,
  };

  promptMessages.push(contextMessage);

  return promptMessages;
}
