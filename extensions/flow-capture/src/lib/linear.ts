import { LinearClient } from "@linear/sdk";

export function getLinearClient(apiKey: string) {
  return new LinearClient({ apiKey });
}

export async function createLinearTask(
  apiKey: string,
  input: { title: string; description?: string; priority?: number },
) {
  const client = getLinearClient(apiKey);

  // Get the first team for now (common in quick capture extensions)
  const teams = await client.teams();
  if (teams.nodes.length === 0) {
    throw new Error("No Linear teams found. Please check your Linear account.");
  }

  const teamId = teams.nodes[0].id;

  const result = await client.createIssue({
    teamId,
    title: input.title,
    description: input.description,
    priority: input.priority,
  });

  const issue = await result.issue;
  return issue;
}
