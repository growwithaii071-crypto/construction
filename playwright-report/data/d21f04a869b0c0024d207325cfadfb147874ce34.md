# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-rbac.spec.ts >> 🔒 Customer Cannot Access Contractor Pages >> customer trying /dashboard (admin) is redirected
- Location: e2e/06-rbac.spec.ts:71:7

# Error details

```
Error: browserType.launch: Executable doesn't exist at /Users/rajeshverma/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```