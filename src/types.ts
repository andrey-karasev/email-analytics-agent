export interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  fromAddress?: string;
  date: string | null;
  isRead: boolean;
  snippet: string;
  receivedDateTime: string;
}

export interface EmailGroup {
  key: string;          // grouping key, e.g. sender domain or subject prefix
  label: string;        // human-readable description
  emails: EmailSummary[];
  account: string;      // "outlook" | "gmail" | custom name
}

export interface Rule {
  pattern: string;      // sender domain or subject keyword
  folder: string;       // destination folder name
  account: string;
  createdAt: string;
}

export interface AccountConfig {
  name: string;
  type: "outlook" | "gmail";
  command: string;
  args: string[];
  cwd: string;
  env?: Record<string, string>;
}
