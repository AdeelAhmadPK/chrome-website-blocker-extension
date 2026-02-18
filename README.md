# SiteBlocker Pro – Website Blocker & Focus Tool

A full-featured, completely free browser extension for Chrome, Firefox, and Edge.  
Block distracting websites, set daily time limits, track your browsing habits, and stay focused with Pomodoro sessions — no account, no subscription, no data ever leaves your device.

---

## Features

| Feature | Description |
|---|---|
| **Block Sites** | Block any domain or keyword instantly. Supports wildcard patterns and per-site schedules (e.g. block Twitter only on weekdays 9–5). |
| **Usage Limits** | Set a daily time budget per site. Once you hit the limit, the site is blocked until midnight. |
| **Insights** | See bar and pie charts of your browsing time by day and by domain. Get suggestions for sites worth blocking. |
| **Focus Mode** | Pomodoro timer (customizable work/break/session counts). All sites except your whitelist are blocked during work intervals. |
| **Password Protection** | Lock your settings behind a SHA-256 hashed password. Brute-force resistant — locks for 10 minutes after 5 wrong attempts. |
| **Custom Block Page** | Choose from 6 block page styles: Default, Motivational, Minimalist, Meme, Redirect, or fully Custom (your own message, color, and image). |
| **Whitelist Mode** | Flip the logic — allow only the sites on your list and block everything else. |
| **Dark Mode** | Full dark/light theme toggle. |
| **Export / Import** | Back up your entire configuration to a JSON file and restore it any time. |

---

## Installation

### From a Release (Recommended for most users)

1. Download the latest `dist-chrome.zip` from the [Releases](../../releases) page.
2. Unzip the file — you'll get a `dist-chrome` folder.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** and select the `dist-chrome` folder.
6. The SiteBlocker Pro icon will appear in your toolbar.

> **Edge**: Follow the same steps at `edge://extensions`.  
> **Firefox**: Use the `dist-firefox` build and load it at `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on**.

---

### Build from Source

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/siteblocker-pro.git
cd siteblocker-pro/extension

# 2. Install dependencies
npm install

# 3. Build for Chrome / Edge
npm run build:chrome       # output → dist-chrome/

# 4. Build for Firefox
npm run build:firefox      # output → dist-firefox/
```

Then load the output folder as an unpacked extension as described above.

---

## How to Use

### Blocking a Site

1. Click the **SiteBlocker Pro** icon in the toolbar.
2. The current site is shown at the top — click **Block** to block it immediately.
3. Or open the **Dashboard** → **Block Sites** → type a domain or keyword → press **Enter** or click **+ Add**.

### Setting a Time Limit

1. Open the Dashboard → **Usage Limit**.
2. Type a site URL and click **+ Add to Block List**.
3. Select a preset limit (15 min, 30 min, 1 hr, 2 hr, 4 hr) or enter a custom number of minutes.
4. A progress bar shows how much time you have left today.

### Starting a Focus Session

1. Open the Dashboard → **Focus Mode**.
2. Adjust work interval, break interval, and number of sessions with the sliders.
3. Add any sites that should stay accessible during your session (e.g. `gmail.com`).
4. Click **Start Focus Session**. A Pomodoro timer counts down in the dashboard and popup.

### Viewing Insights

1. Open the Dashboard → **Insights**.
2. Switch between **Today**, **7 Days**, and **30 Days** using the buttons in the top-right.
3. The bar chart shows daily browsing time; the pie chart shows your top sites.
4. The table lists every tracked domain with visit count, total time, and share of your browsing.
5. A suggestions panel highlights high-usage unblocked sites you may want to limit.

### Blocking by Category

1. Open the Dashboard → **Block Sites** → click **Categories**.
2. Select one or more categories (Social Media, Video & Streaming, Gaming, News, Shopping, Adult Content, Gambling).
3. Click **Add** to block all domains in the selected categories at once.

### Setting Up a Password

1. Open the Dashboard → **Password Protection**.
2. Click **Enable** and set a password (minimum 4 characters).
3. Any attempt to add/remove blocked sites or change settings will now require the password.

> **Forgot your password?** Go to Dashboard → **Settings** → **Reset All Data**. This clears everything and removes the password lock.

### Customizing the Block Page

1. Open the Dashboard → **Custom Block Page**.
2. Pick a style on the left panel — a live preview updates on the right.
3. For the **Redirect** mode, enter the URL you want to send users to and set a delay.
4. For **Custom**, write your own message, pick a background color, and optionally upload a background image.

---

## Privacy

- All data is stored locally using `chrome.storage.local`.
- Nothing is ever sent to any server.
- No account is required.
- No analytics, no telemetry, no ads.

---

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `declarativeNetRequest` | Block URLs using Chrome's built-in rule engine (no page content is ever read). |
| `storage` | Save your block list, settings, and insights locally in the browser. |
| `tabs` | Detect the current tab's domain in the popup so you can block it in one click. |
| `scripting` | Inject the time-tracking content script into pages. |
| `webNavigation` | Detect page visits for accurate time tracking. |
| `alarms` | Schedule daily usage resets at midnight. |
| `notifications` | Alert you when a time limit is reached or a focus session ends. |

---

## Development

```
extension/
├── src/
│   ├── background/       # Service worker — rule engine, alarms, focus mode
│   ├── content/          # Time-tracking content script
│   ├── pages/
│   │   ├── dashboard/    # React SPA (8 pages + Sidebar)
│   │   ├── blocked/      # Page shown when a site is blocked
│   │   └── popup/        # Toolbar popup (320px)
│   └── shared/           # Types, storage, utils, categories
├── public/icons/         # Extension icons (16, 48, 128px)
├── manifest.json         # Chrome MV3 manifest
├── manifest_firefox.json # Firefox MV2 manifest
├── vite.config.ts        # Multi-entry Vite build
└── tailwind.config.js
```

**Stack:** React 18 · TypeScript 5 · Tailwind CSS 3 · Vite 5 · Recharts · webextension-polyfill

---

## Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes: `git commit -m "Add my change"`
4. Push and open a Pull Request

---

## License

MIT © 2026 [Muhammad Adeel](https://adeelahmad.com)
