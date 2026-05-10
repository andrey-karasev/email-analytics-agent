import type { EmailSummary, EmailGroup } from "./types.js";
import { extractDomain } from "./rules.js";

export function groupEmails(emails: EmailSummary[], account: string): EmailGroup[] {
  const map = new Map<string, EmailSummary[]>();

  for (const email of emails) {
    const key = extractDomain(email.fromAddress ?? email.from);
    const bucket = map.get(key) ?? [];
    bucket.push(email);
    map.set(key, bucket);
  }

  return Array.from(map.entries())
    .filter(([, emails]) => emails.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([key, emails]) => ({
      key,
      label: `${emails[0].from} <${key}> — ${emails.length} email(s)`,
      emails,
      account
    }));
}

export function printAnalytics(groups: EmailGroup[]): void {
  console.log(`\n📊 Analytics — ${groups[0]?.account ?? "unknown"} (${groups.reduce((s, g) => s + g.emails.length, 0)} emails, ${groups.length} groups)\n`);
  for (const [i, g] of groups.entries()) {
    const subjects = [...new Set(g.emails.map((e) => e.subject.slice(0, 60)))].slice(0, 3);
    console.log(`  [${i + 1}] ${g.label}`);
    subjects.forEach((s) => console.log(`       • ${s}`));
  }
  console.log();
}
