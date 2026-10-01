from uuid import uuid4

from backend.app.api.exchanges import router as exchanges_router

import httpx
from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import select

from backend.app.models.chat import (
    ChatRequest,
    ChatResponse,
    HistoryResponse,
    MessageResponse,
)
from backend.app.services.exact_table import try_exact_answer
from backend.app.services.groq_llm import GroqError, generate_answer
from backend.app.storage.database import Conversation, Message, SessionLocal

router = APIRouter(prefix="/api", tags=["chat"])
router.routes.extend(exchanges_router.routes)


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, request: Request) -> ChatResponse:
    async with SessionLocal() as session:
        conversation = (
            await session.get(Conversation, payload.conversation_id)
            if payload.conversation_id
            else None
        )
        if payload.conversation_id and conversation is None:
            raise HTTPException(status_code=404, detail="Conversation not found")

        if conversation is None:
            conversation = Conversation(id=str(uuid4()))
            session.add(conversation)

        page_url = payload.page_url or conversation.page_url
        page_content = payload.page_content or conversation.page_content

        previous = (
            await session.scalars(
                select(Message)
                .where(Message.conversation_id == conversation.id)
                .order_by(Message.id.desc())
                .limit(10)
            )
        ).all()
        history = [
            {"role": item.role, "content": item.content}
            for item in reversed(previous)
        ]

        answer = try_exact_answer(payload.question, page_content)
        if answer is None:
            try:
                answer = await generate_answer(
                    request.app.state.http_client,
                    page_url,
                    page_content,
                    history,
                    payload.question,
                )
            except GroqError as exc:
                raise HTTPException(status_code=502, detail=str(exc)) from exc

        conversation.page_url = page_url
        conversation.page_content = page_content
        session.add_all(
            [
                Message(
                    conversation_id=conversation.id,
                    role="user",
                    content=payload.question,
                ),
                Message(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=answer,
                ),
            ]
        )
        await session.commit()
        return ChatResponse(
            conversation_id=conversation.id,
            answer=answer,
            page_url=page_url,
        )


@router.get("/conversations/{conversation_id}", response_model=HistoryResponse)
async def get_history(conversation_id: str) -> HistoryResponse:
    async with SessionLocal() as session:
        if await session.get(Conversation, conversation_id) is None:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = (
            await session.scalars(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.id)
            )
        ).all()
        return HistoryResponse(
            conversation_id=conversation_id,
            messages=[
                MessageResponse(role=item.role, content=item.content)
                for item in messages
            ],
        )

