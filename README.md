# GramJS Test Page

A simple web-based Telegram client tester using GramJS library.

## Features

- ✅ Connect to Telegram using session string
- ✅ List all groups and channels
- ✅ Receive messages in real-time
- ✅ Send messages to any chat

## Setup

### Prerequisites

You need:
1. **API ID** and **API Hash** from [my.telegram.org](https://my.telegram.org)
2. **Session String** from an authenticated Telegram session

### Building GramJS (Already Done)

The `telegram-browser.js` file is already included, but if you need to rebuild:

```bash
cd test-page
git clone https://github.com/gram-js/gramjs.git gramjs-source
cd gramjs-source
npm install
npx webpack
cp browser/telegram.js ../telegram-browser.js
cd ..
```

### How to Run

1. **Open the page:**
   ```bash
   cd test-page
   # Option 1: Using Python
   python3 -m http.server 8000

   # Option 2: Using Node.js (if you have http-server)
   npx http-server -p 8000

   # Option 3: Using PHP
   php -S localhost:8000
   ```

2. **Open in browser:**
   ```
   http://localhost:8000
   ```

3. **Enter your credentials:**
   - API ID: `` (pre-filled from your .env)
   - API Hash: `` (pre-filled from your .env)
   - Session String: Paste your session string

4. **Click "Connect"** and start testing!

## Usage

### 1️⃣ Connect
- Enter your API credentials and session string
- Click "Connect"
- You should see your name and username

### 2️⃣ List Dialogs
- Click "Fetch Dialogs"
- View all your groups and channels
- Click on any dialog to select it for messaging

### 3️⃣ Receive Messages
- Click "Start Listening"
- New messages will appear in real-time
- Click "Stop Listening" when done

### 4️⃣ Send Messages
- Enter chat username (e.g., `@username`) or chat ID
- Type your message
- Click "Send Message"

## How to Get Session String

You can get a session string from your backend by:

1. **During QR authentication:**
   - After scanning QR code, the session string is saved in the database
   - Check the `TelegramAccount.sessionData` field

2. **From database:**
   ```sql
   SELECT sessionData FROM TelegramAccount WHERE phoneNumber = 'YOUR_PHONE';
   ```

3. **From your backend API:**
   - Login to admin panel
   - Go to Telegram Accounts
   - The session is stored encrypted in the database

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Requires modern browser with ES6+ support

## Security Notes

⚠️ **IMPORTANT:**
- Never share your session string - it gives full access to your Telegram account
- This is a TEST page only - don't use in production
- Session strings should be stored encrypted in production
- Use HTTPS in production environments

## Troubleshooting

### Connection Issues
- Make sure your session string is valid
- Check browser console for errors
- Verify API ID and Hash are correct

### CORS Errors
- Must run via HTTP server (not file://)
- Use `python3 -m http.server` or similar

### Messages Not Appearing
- Make sure you clicked "Start Listening"
- Check browser console for errors
- Try refreshing the page and reconnecting

## Technical Details

- **Library**: GramJS v2.22.2 (loaded via CDN)
- **Session Type**: StringSession
- **Connection**: Direct Telegram API
- **Updates**: Real-time via event handlers

## Files

- `index.html` - Main HTML page with UI
- `app.js` - JavaScript application logic
- `README.md` - This file
