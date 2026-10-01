# Smart Chatbot

A browser assistant that reads the current page, answers questions with
conversation context, accepts Sarvam AI voice input, and performs clicks
only through an explicitly supplied page skeleton.

## Components

- `backend/app/api`: HTTP endpoints
- `backend/app/core`: settings and shared configuration
- `backend/app/models`: request and response schemas
- `backend/app/services`: Jev routing, answers, voice and conversation logic
- `backend/app/storage`: persistent chat history
- `extension/src`: page reading and allowed action execution
- `extension/popup`: chat interface and microphone button
- `page-skeletons`: allowed actions for specific pages

Copy `.env.example` to `.env` and fill API keys locally.
Never place API keys in the browser extension.
