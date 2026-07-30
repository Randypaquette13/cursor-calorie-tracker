# Cursor Calorie Tracker

A React Native (Expo Go) calorie tracker that stores all data locally on your phone.

- **Natural language logging** — describe meals in plain English; parsed with the **Cursor Cloud Agents API**
- **Barcode scanning** — looks up products via the free **Open Food Facts** API
- **Today tab** — daily summary and meal list
- **History tab** — browse past days and review entries
- **Local SQLite storage** — no cloud sync, no account required

## Requirements

- [Node.js](https://nodejs.org/) 20+
- [Expo Go](https://expo.dev/go) on your iPhone or Android device
- A **Cursor API key** from [cursor.com/dashboard/api](https://cursor.com/dashboard/api) (for natural-language parsing only)

## Quick start

```bash
git clone <your-repo-url>
cd cursor-calorie-tracker
npm install
npm start
```

Scan the QR code with Expo Go.

## First-time setup

1. Open the **Settings** tab
2. Paste your Cursor API key (`crsr_...`)
3. Go to **Today** and tap **Log with natural language** or **Scan barcode**

## How it works

| Feature | Backend |
|---------|---------|
| Natural language | Cursor Cloud Agents API (`POST /v1/agents`, poll run result) |
| Barcode | Open Food Facts REST API |
| Storage | `expo-sqlite` on device |
| API key | `expo-secure-store` |

Natural-language parsing may take 10–30 seconds because it runs a Cursor cloud agent. Barcode lookups are instant.

## Project structure

```
app/                 Expo Router screens (Today, History, Settings, Barcode)
components/          UI components
context/             Food data provider
services/            SQLite, Cursor parser, Open Food Facts
types/               Shared TypeScript types
utils/               Meal-type helpers
```

## Scripts

```bash
npm start     # Start Expo dev server
npm run ios   # Open iOS simulator (macOS only)
npm run android
npm run web
```

## Notes

- Long-press an entry to delete it
- Barcode nutrition values come from Open Food Facts serving/100g data when available
- Clearing your API key in Settings also resets the cached Cursor parser agent id

## License

MIT
