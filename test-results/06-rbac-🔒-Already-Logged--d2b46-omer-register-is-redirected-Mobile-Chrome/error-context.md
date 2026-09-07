# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-rbac.spec.ts >> 🔒 Already Logged-in User Cannot Re-visit Login Page >> logged-in customer visiting /customer/register is redirected
- Location: e2e/06-rbac.spec.ts:111:7

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