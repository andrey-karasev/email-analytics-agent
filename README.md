# Email Analytics Agent

An intelligent agent that reads emails from Outlook and Gmail MCP servers, groups them by sender domain, and learns folder organization rules through interactive user feedback.

## Features

- **Multi-account support**: Connect to both Outlook (Microsoft Graph) and Gmail (IMAP) MCP servers
- **Smart grouping**: Automatically clusters emails by sender domain for batch processing
- **Rule learning**: Remembers your folder preferences and auto-applies them on future runs
- **Interactive workflow**: Asks you where to move each group, with options to create new folders
- **Auto-application**: Applies learned rules automatically before prompting for new decisions
- **Persistent storage**: Saves learned rules to `rules.json` for continuous improvement

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Outlook MCP   │    │   Gmail MCP     │    │   Agent         │
│   Server        │◄──►│   Server        │◄──►│   (this repo)   │
│   (Graph API)   │    │   (IMAP/POP3)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
                                                ┌─────────────┐
                                                │  rules.json │
                                                │  (learned)  │
                                                └─────────────┘
```

## Prerequisites

1. **Outlook MCP Server** installed and configured: [outlook-mcp-server](https://github.com/andrey-karasev/outlook-mcp-server)
2. **Gmail MCP Server** installed and configured: [gmail-mcp-server](https://github.com/andrey-karasev/gmail-mcp-server)
3. Node.js 18+ and npm

## Installation

```bash
git clone https://github.com/andrey-karasev/email-analytics-agent.git
cd email-analytics-agent
npm install
npm run build
```

## Configuration

Create `.env` file with credentials for both accounts:

```env
# Outlook account (from outlook-mcp-server/.env)
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_TENANT_ID=common
OUTLOOK_REFRESH_TOKEN=your_refresh_token

# Gmail account (from gmail-mcp-server/.env)
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

## Usage

```bash
npm start
```

### Example Workflow

```
🤖 Email Analytics Agent

📚 Loaded 3 learned rule(s).

🔌 Connecting to outlook...
✅ Auto-moved 5 email(s) using learned rules.

📊 Analytics — outlook (15 emails, 3 groups)

  [1] Amazon <amazon.com> — 8 email(s)
       • Your Amazon order has shipped
       • Your Amazon order confirmation
       • Review your recent purchase

  [2] GitHub <github.com> — 4 email(s)
       • [GitHub] Security alert
       • [GitHub] Repository activity

  [3] Newsletter <newsletter.example.com> — 3 email(s)
       • Weekly tech digest
       • Monthly newsletter

Organize these groups into folders? [y/N] y

📁 Available folders for [outlook]:
  [1] Inbox
  [2] Archive
  [3] Shopping
  [n] Create new folder
  [s] Skip this group

Where to move "Amazon <amazon.com> — 8 email(s)"? 3
  ✓ Moved 8 email(s) to "Shopping"
  💡 Remember this rule (amazon.com → Shopping)? [Y/n] y
  📚 Rule saved.
```

## How It Works

1. **Connect & Fetch**: Connects to configured MCP servers and fetches recent emails
2. **Auto-apply Rules**: Applies existing learned rules from `rules.json` automatically
3. **Group Remaining**: Clusters remaining emails by sender domain
4. **Interactive Prompt**: Shows groups and asks for folder assignment
5. **Learn & Save**: Optionally saves new rules for future auto-application
6. **Repeat**: Moves to next account or exits

## File Structure

```
email-analytics-agent/
├── src/
│   ├── agent.ts          # Main interactive agent loop
│   ├── mcpClient.ts      # MCP stdio client for outlook/gmail servers
│   ├── analytics.ts      # Email grouping and analytics display
│   ├── rules.ts          # Load/save/match learned rules
│   └── types.ts          # Shared TypeScript interfaces
├── .env                  # Account credentials (gitignored)
├── rules.json            # Learned rules (gitignored, auto-created)
├── package.json
└── tsconfig.json
```

## Learned Rules Format

Rules are saved in `rules.json`:

```json
[
  {
    "pattern": "amazon.com",
    "folder": "Shopping",
    "account": "outlook",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "pattern": "github.com",
    "folder": "Work",
    "account": "gmail",
    "createdAt": "2024-01-14T14:20:00.000Z"
  }
]
```

- `pattern`: Sender domain or keyword to match
- `folder`: Destination folder name
- `account`: Which account this rule applies to
- `createdAt`: When the rule was learned

## Integration with MCP Servers

This agent requires the latest versions of both MCP servers with folder support:

- **outlook-mcp-server**: v1.0.0+ with `outlook_list_folders` and `outlook_move_email` tools
- **gmail-mcp-server**: v1.0.0+ with `gmail_list_folders` and `gmail_move_email` tools

## Development

```bash
# Development mode with auto-reload
npm run dev

# Build TypeScript
npm run build

# Run compiled version
npm start
```

## License

MIT
