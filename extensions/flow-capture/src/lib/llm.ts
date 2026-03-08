import OpenAI from "openai";

export function getOpenAIClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export async function processTaskWithLLM(apiKey: string, input: string) {
  const openai = getOpenAIClient(apiKey);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Use a fast and cheap model by default
    messages: [
      {
        role: "system",
        content: `You are a task assistant. Extract a structured task from the user's input.
        Return a JSON object with:
        - title: Short, actionable title.
        - description: Any extra details or context.
        - priority: A number from 0-4 (0=No Priority, 1=Urgent, 2=High, 3=Normal, 4=Low).
        
        Input can be messy. Just return JSON.`,
      },
      {
        role: "user",
        content: input,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("LLM returned empty response");

  return JSON.parse(content) as {
    title: string;
    description?: string;
    priority?: number;
  };
}
