from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from backend.app.services.sarvam_stt import SpeechError, transcribe_audio

router = APIRouter(prefix="/api/voice", tags=["voice"])


class TranscriptResponse(BaseModel):
    transcript: str


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(
    request: Request,
    file: UploadFile = File(...),
) -> TranscriptResponse:
    try:
        audio = await file.read(2_000_001)
        if not audio or len(audio) > 2_000_000:
            raise HTTPException(status_code=413, detail="The audio is empty or exceeds the size limit.")

        transcript = await transcribe_audio(request.app.state.http_client, audio)
        return TranscriptResponse(transcript=transcript)
    except SpeechError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    finally:
        await file.close()

