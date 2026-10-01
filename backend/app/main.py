from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.actions import router as actions_router
from backend.app.api.voice import router as voice_router
from backend.app.api.chat import router
from backend.app.storage.database import create_tables, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    async with httpx.AsyncClient(timeout=httpx.Timeout(20.0)) as client:
        app.state.http_client = client
        yield
    await engine.dispose()


app = FastAPI(title="Smart Chatbot", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"chrome-extension://[a-z]{32}",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

app.include_router(router)
app.include_router(voice_router)
app.include_router(actions_router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


