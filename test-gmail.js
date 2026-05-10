import "dotenv/config";
import { McpEmailClient } from "./dist/mcpClient.js";
import { resolve } from "path";

async function testGmailConnection() {
  console.log("Testing Gmail connection...\n");
  
  const account = {
    name: "gmail",
    type: "gmail",
    command: "node",
    args: ["dist/index.js"],
    cwd: resolve(import.meta.dirname, "../gmail-mcp-server"),
    env: {
      GMAIL_USER: process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
      GMAIL_MAILBOX: "INBOX"
    }
  };

  const client = new McpEmailClient(account);
  
  try {
    console.log("Connecting to Gmail MCP server...");
    await client.connect();
    console.log("Connected successfully!\n");
    
    console.log("Listing folders...");
    const folders = await client.listFolders();
    console.log(`Found ${folders.length} folders:\n`);
    folders.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
    
    console.log("\nListing emails...");
    const emails = await client.listEmails(5);
    console.log(`Found ${emails.length} emails`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.disconnect().catch(() => {});
    console.log("\nDisconnected.");
  }
}

testGmailConnection();
