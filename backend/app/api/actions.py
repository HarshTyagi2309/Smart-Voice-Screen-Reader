from fastapi import APIRouter, HTTPException, Request

from backend.app.models.actions import SelectActionRequest, SelectActionResponse
from backend.app.services.jev_router import JevError, select_action

router = APIRouter(prefix="/api/actions", tags=["actions"])


@router.post("/select", response_model=SelectActionResponse)
async def select_allowed_action(
    payload: SelectActionRequest,
    request: Request,
) -> SelectActionResponse:
    try:
        return await select_action(request.app.state.http_client, payload)
    except JevError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
