# Smart Voice Screen Reader

A page-aware AI chatbot built with FastAPI and a Chrome extension. It answers questions about the current webpage, handles general questions, accepts voice input, and performs browser actions through supplied page skeletons.

## Features

- **Webpage Q&A:** Ask questions about the current page.
- **General questions:** Get answers through Groq.
- **Conversation memory:** Follow up on earlier questions using saved history.
- **Table queries:** Count members and filter by age in supported table formats.
- **Voice input:** Record speech using the chatbot's microphone button.
- **Automatic submission:** Stop recording to transcribe and submit.
- **Natural-language actions:** Request supported navigation in English, Hindi or Hinglish.
- **English responses:** Assistant responses and interface messages are configured in English.
- **Bold formatting:** Bold text renders within chat messages.
- **Background actions:** Navigation and history saving run through an extension service worker.

## Technology Stack

| Component | Technology |
|---|---|
| Backend | Python 3.12+, FastAPI |
| HTTP requests | Async HTTPX |
| Answers and intent routing | Groq |
| Default model | `openai/gpt-oss-20b` |
| Speech-to-text | Sarvam AI |
| Database | SQLite, SQLAlchemy async, aiosqlite |
| Browser extension | Chrome Manifest V3 |
| Interface | HTML, CSS, JavaScript modules |

## Project Structure

| Path | Purpose |
|---|---|
| `backend/app/api/` | HTTP endpoints |
| `backend/app/core/` | Application settings |
| `backend/app/models/` | Request and response schemas |
| `backend/app/services/` | Answers, intent routing, table queries and transcription |
| `backend/app/storage/` | Database models and sessions |
| `extension/popup/` | Chatbot interface |
| `extension/src/` | Page reading, voice, actions and history helpers |
| `extension/page-skeletons/` | Allowed website actions |
| `extension/background.js` | Background action handling |
| `.env.example` | Configuration template |
| `run.ps1` | Backend launcher |

The legacy filename `jev_router.py` currently contains **Groq-based routing**. No Jev API key is required.

## Local Setup

### 1. Clone the repository

```powershell
git clone https://github.com/HarshTyagi2309/Smart-Voice-Screen-Reader.git
cd Smart-Voice-Screen-Reader
```

### 2. Create the virtual environment and install dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
```

### 3. Configure API keys

Create `.env` only if it does not already exist:

```powershell
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Fill in your keys locally:

```dotenv
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-20b
SARVAM_API_KEY=your_sarvam_api_key
DATABASE_URL=sqlite+aiosqlite:///./smart_chatbot.db
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
```

Keep real API keys in the backend `.env` file. Never put them in the extension or commit them to GitHub.

### 4. Start the backend

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\run.ps1
```

Manual virtual environment activation is not required. Keep this terminal running.

- API documentation: http://127.0.0.1:8000/docs
- Health endpoint: http://127.0.0.1:8000/health

## Load the Chrome Extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the repository's `extension` folder.
5. Open a normal HTTP or HTTPS website.
6. Click the Smart Chatbot extension icon.

After changing extension files, reload the extension on `chrome://extensions`.

## Voice Input

1. Open the chatbot on a website.
2. Click **Mic**.
3. Speak your question or command.
4. Click **Stop**.
5. The transcript is submitted automatically.

Recording is limited to **15 seconds**.

If microphone permission is needed:

1. Find the extension ID on `chrome://extensions`.
2. Open `chrome-extension://YOUR_EXTENSION_ID/microphone-permission.html`.
3. Use the permission button and allow microphone access.
4. Return to the website and reopen the chatbot.

## Example Questions and Commands

| Input | Expected behavior |
|---|---|
| `Tell me about this page.` | Summarize the supplied page content |
| `What is FastAPI?` | Answer using general knowledge |
| `Total members kitne hain?` | Count members in a supported extracted table |
| `Inme se 18 se kam kaun hain?` | Filter members by age using conversation context |
| `Click on About` | Open the allowed About section |
| `Go to Skills` | Open the allowed Skills section |
| `upar jao top pr` | Request scrolling to the top |
| `GitHub` | Request the allowed GitHub navigation |

Browser actions require a matching supplied page skeleton. The included skeleton targets **harshtyagi2309.vercel.app**.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Backend health |
| POST | `/api/chat` | General and page-related answers |
| GET | `/api/conversations/{conversation_id}` | Saved conversation history |
| POST | `/api/conversations/exchanges` | Save action or clarification exchanges |
| POST | `/api/actions/select` | Select intent and an allowed action |
| POST | `/api/voice/transcribe` | Convert audio to text |

## Scope and Limitations

- Reads the current Chrome webpage; desktop applications are not supported.
- Page extraction is bounded and does not automatically retrieve all paginated or unloaded data.
- Exact table logic supports selected member-count and age-filter formats.
- Actions are restricted to the supplied website skeleton.
- Other readable websites support Q&A, but need their own skeleton for actions.
- External navigation responses acknowledge the navigation request; destination loading is not verified.
- The backend must be running for AI requests and persistent history.
- Recent history and background-action changes need further end-to-end testing.
- Production scalability has not been verified.
- Provider limits, availability and credits depend on the configured accounts.

## API Key Handling

- Store real keys only in backend `.env`.
- Keep `.env.example` free of real keys.
- Never embed keys in browser code.
- `.env`, virtual environments, databases and generated backup files are ignored by Git.
