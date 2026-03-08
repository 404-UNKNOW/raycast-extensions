import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import { createLinearTask } from "./lib/linear";
import { processTaskWithLLM } from "./lib/llm";

interface FormValues {
  title: string;
  description: string;
  priority: string;
  useAI: boolean;
}

interface Preferences {
  linearApiKey: string;
  llmApiKey: string;
  defaultAssignee?: string;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const preferences = getPreferenceValues<Preferences>();

  async function handleSubmit(values: FormValues) {
    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Creating task...",
    });

    try {
      let taskData = {
        title: values.title,
        description: values.description,
        priority: parseInt(values.priority) || 0,
      };

      if (values.useAI && values.title) {
        toast.title = "AI processing...";
        const processed = await processTaskWithLLM(
          preferences.llmApiKey,
          values.title + (values.description ? "\n" + values.description : ""),
        );
        taskData = {
          ...taskData,
          ...processed,
          // Merge priorities carefully if needed
        };
      }

      toast.title = "Creating in Linear...";
      const issue = await createLinearTask(preferences.linearApiKey, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
      });

      toast.style = Toast.Style.Success;
      toast.title = "Task created!";
      toast.message = `Issue: ${issue?.identifier}`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to create task";
      if (error instanceof Error) {
        toast.message = error.message;
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Task" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="What needs to be done?"
      />
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="More details (optional)..."
      />

      <Form.Separator />

      <Form.Dropdown id="priority" title="Priority" defaultValue="0">
        <Form.Dropdown.Item value="0" title="No Priority" />
        <Form.Dropdown.Item value="1" title="Urgent" />
        <Form.Dropdown.Item value="2" title="High" />
        <Form.Dropdown.Item value="3" title="Medium" />
        <Form.Dropdown.Item value="4" title="Low" />
      </Form.Dropdown>

      <Form.Checkbox
        id="useAI"
        title="Use AI Magic"
        label="Auto-refine title, description and priority"
        defaultValue={false}
      />
    </Form>
  );
}
