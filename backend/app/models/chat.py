from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None
    page_url: str = ""
    page_content: str = Field(default="", max_length=30000)


class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    page_url: str


class MessageResponse(BaseModel):
    role: str
    content: str


class HistoryResponse(BaseModel):
    conversation_id: str
    messages: list[MessageResponse]
