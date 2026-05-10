import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { AccountConfig, EmailSummary } from "./types.js";

export class McpEmailClient {
  private client: Client;
  private transport: StdioClientTransport;

  constructor(private readonly account: AccountConfig) {
    this.transport = new StdioClientTransport({
      command: account.command,
      args: account.args,
      env: { ...process.env, ...account.env } as Record<string, string>,
      cwd: account.cwd
    });
    this.client = new Client({ name: "email-analytics-agent", version: "1.0.0" });
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
  }

  async listEmails(limit = 50, folder?: string): Promise<EmailSummary[]> {
    const args: Record<string, unknown> = { limit };
    if (folder) args.folder = folder;

    const result = await this.client.callTool({
      name: this.account.type === "outlook" ? "outlook_list_emails" : "gmail_list_emails",
      arguments: args
    });

    const text = (result.content as Array<{ type: string; text: string }>)
      .find((c) => c.type === "text")?.text ?? "[]";
    return JSON.parse(text) as EmailSummary[];
  }

  async listFolders(): Promise<string[]> {
    const toolName = this.account.type === "outlook" ? "outlook_list_folders" : "gmail_list_folders";
    const result = await this.client.callTool({ name: toolName, arguments: {} });
    const text = (result.content as Array<{ type: string; text: string }>)
      .find((c) => c.type === "text")?.text ?? "[]";
    const parsed = JSON.parse(text) as Array<{ displayName: string } | string>;
    return parsed.map((f) => (typeof f === "string" ? f : f.displayName));
  }

  async moveEmail(id: string, folder: string): Promise<void> {
    const toolName = this.account.type === "outlook" ? "outlook_move_email" : "gmail_move_email";
    await this.client.callTool({
      name: toolName,
      arguments: { id, destinationFolder: folder }
    });
  }
}
