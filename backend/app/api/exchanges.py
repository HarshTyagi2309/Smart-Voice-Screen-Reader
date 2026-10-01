from uuid import uuid4

from fastapi import APIRouter, HTTPException

from backend.app.models.chat import ChatResponse
from backend.app.models.exchange import SaveExchangeRequest
from backend.app.storage.database import Conversation, Message, SessionLocal

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/conversations/exchanges", response_model=ChatResponse)
async def save_exchange(payload: SaveExchangeRequest) -> ChatResponse:
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

        conversation.page_url = payload.page_url or conversation.page_url
        conversation.page_content = payload.page_content or conversation.page_content
        await session.flush()

        session.add_all([
            Message(
                conversation_id=conversation.id,
                role="user",
                content=payload.question,
            ),
            Message(
                conversation_id=conversation.id,
                role="assistant",
                content=payload.answer,
            ),
        ])
        await session.commit()

        return ChatResponse(
            conversation_id=conversation.id,
            answer=payload.answer,
            page_url=conversation.page_url,
        )
