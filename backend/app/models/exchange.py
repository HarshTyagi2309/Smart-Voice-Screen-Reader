from pydantic import BaseModel, Field


class SaveExchangeRequest(BaseModel):
    conversation_id: str | None = None
    question: str = Field(min_length=1, max_length=2000)
    answer: str = Field(min_length=1, max_length=4000)
    page_url: str = Field(default="", max_length=2000)
    page_content: str = Field(default="", max_length=30000)
