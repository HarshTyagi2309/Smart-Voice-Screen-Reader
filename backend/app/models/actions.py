from pydantic import BaseModel, Field
from typing import Literal


class AllowedAction(BaseModel):
    id: str = Field(pattern=r"^[a-z][a-z0-9_]{0,49}$")
    label: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=200)


class SelectActionRequest(BaseModel):
    command: str = Field(min_length=1, max_length=500)
    page_url: str = Field(min_length=1, max_length=2000)
    actions: list[AllowedAction] = Field(default_factory=list, max_length=30)


class SelectActionResponse(BaseModel):
    intent: Literal["action", "question", "clarify"]
    action_id: str | None = None
    message: str = ""
