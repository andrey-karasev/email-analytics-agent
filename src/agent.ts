import "dotenv/config";
import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { resolve } from "path";

import type { AccountConfig, EmailGroup, Rule } from "./types.js";
import { McpEmailClient } from "./mcpClient.js";
import { groupEmails, printAnalytics } from "./analytics.js";
import { loadRules, saveRule, matchRule } from "./rules.js";

// ── Account definitions ────────────────────────────────────────────────────

const ACCOUNTS: AccountConfig[] = [
  {
    name: "outlook",
    type: "outlook",
    command: "node",
    args: ["dist/index.js"],
    cwd: resolve(import.meta.dirname, "../../outlook-mcp-server"),
    env: {
      OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID ?? "",
      OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET ?? "",
      OUTLOOK_TENANT_ID: process.env.OUTLOOK_TENANT_ID ?? "common",
      OUTLOOK_REFRESH_TOKEN: process.env.OUTLOOK_REFRESH_TOKEN ?? "",
      OUTLOOK_MAILBOX: "inbox",
      OUTLOOK_BATCH_SIZE: "50"
    }
  },
  {
    name: "gmail",
    type: "gmail",
    command: "node",
    args: ["dist/index.js"],
    cwd: resolve(import.meta.dirname, "../../gmail-mcp-server"),
    env: {
      GMAIL_USER: process.env.GMAIL_USER ?? "",
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ?? "",
      GMAIL_MAILBOX: "INBOX"
    }
  }
];

// ── Helpers ────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input, output });

async function ask(prompt: string): Promise<string> {
  return (await rl.question(prompt)).trim();
}

async function pickFolder(
  client: McpEmailClient,
  account: AccountConfig,
  groupLabel: string
): Promise<string | null> {
  const folders = await client.listFolders().catch(() => [] as string[]);

  console.log(`\n📁 Available folders for [${account.name}]:`);
  if (folders.length > 0) {
    folders.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
  }
  console.log(`  [n] Create new folder`);
  console.log(`  [s] Skip this group`);

  const answer = await ask(`\nWhere to move "${groupLabel}"? `);

  if (answer === "s" || answer === "") return null;
  if (answer === "n") {
    const name = await ask("New folder name: ");
    return name || null;
  }

  const idx = parseInt(answer, 10) - 1;
  if (!isNaN(idx) && folders[idx]) return folders[idx];

  // treat raw text as folder name
  return answer || null;
}

// ── Core agent logic ───────────────────────────────────────────────────────

async function processAccount(account: AccountConfig, rules: Rule[]): Promise<Rule[]> {
  console.log(`\n🔌 Connecting to ${account.name}...`);
  const client = new McpEmailClient(account);

  try {
    await client.connect();
    const emails = await client.listEmails(50);
    if (emails.length === 0) {
      console.log(`  No emails found in ${account.name}.`);
      return rules;
    }

    // Auto-apply existing rules
    const autoMoved: string[] = [];
    for (const email of emails) {
      const rule = matchRule(email.fromAddress ?? email.from, email.subject, account.name, rules);
      if (rule) {
        await client.moveEmail(email.id, rule.folder).catch(() => {});
        autoMoved.push(email.subject.slice(0, 50));
      }
    }
    if (autoMoved.length > 0) {
      console.log(`\n✅ Auto-moved ${autoMoved.length} email(s) using learned rules.`);
    }

    // Group remaining emails (those not matched by rules)
    const remaining = emails.filter(
      (e) => !matchRule(e.fromAddress ?? e.from, e.subject, account.name, rules)
    );
    const groups = groupEmails(remaining, account.name);
    if (groups.length === 0) return rules;

    printAnalytics(groups);

    const doOrganize = await ask("Organize these groups into folders? [y/N] ");
    if (doOrganize.toLowerCase() !== "y") return rules;

    for (const group of groups) {
      const folder = await pickFolder(client, account, group.label);
      if (!folder) continue;

      // Move all emails in group
      let moved = 0;
      for (const email of group.emails) {
        await client.moveEmail(email.id, folder).catch(() => {});
        moved++;
      }
      console.log(`  ✓ Moved ${moved} email(s) to "${folder}"`);

      // Learn the rule
      const learnAnswer = await ask(`  💡 Remember this rule (${group.key} → ${folder})? [Y/n] `);
      if (learnAnswer.toLowerCase() !== "n") {
        rules = saveRule(
          { pattern: group.key, folder, account: account.name, createdAt: new Date().toISOString() },
          rules
        );
        console.log(`  📚 Rule saved.`);
      }
    }
  } finally {
    await client.disconnect().catch(() => {});
  }

  return rules;
}

// ── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("🤖 Email Analytics Agent\n");

  let rules = loadRules();
  console.log(`📚 Loaded ${rules.length} learned rule(s).`);

  const accountsToRun = ACCOUNTS.filter((a) => {
    if (a.type === "outlook") return !!a.env?.OUTLOOK_CLIENT_ID;
    if (a.type === "gmail") return !!a.env?.GMAIL_USER;
    return false;
  });

  if (accountsToRun.length === 0) {
    console.error("❌ No accounts configured. Set env vars in .env");
    process.exit(1);
  }

  for (const account of accountsToRun) {
    rules = await processAccount(account, rules);
  }

  console.log("\n✅ Done.\n");
  rl.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
