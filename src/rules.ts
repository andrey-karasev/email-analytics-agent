import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { Rule } from "./types.js";

const RULES_FILE = resolve(process.cwd(), "rules.json");

export function loadRules(): Rule[] {
  if (!existsSync(RULES_FILE)) return [];
  try {
    return JSON.parse(readFileSync(RULES_FILE, "utf-8")) as Rule[];
  } catch {
    return [];
  }
}

export function saveRule(rule: Rule, rules: Rule[]): Rule[] {
  const existing = rules.findIndex(
    (r) => r.pattern === rule.pattern && r.account === rule.account
  );
  if (existing >= 0) {
    rules[existing] = rule;
  } else {
    rules.push(rule);
  }
  writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), "utf-8");
  return rules;
}

export function matchRule(
  emailFrom: string,
  subject: string,
  account: string,
  rules: Rule[]
): Rule | undefined {
  const domain = extractDomain(emailFrom);
  return rules.find(
    (r) =>
      r.account === account &&
      (emailFrom.toLowerCase().includes(r.pattern.toLowerCase()) ||
        domain.includes(r.pattern.toLowerCase()) ||
        subject.toLowerCase().includes(r.pattern.toLowerCase()))
  );
}

export function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : email.toLowerCase();
}
