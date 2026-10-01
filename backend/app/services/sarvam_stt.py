import httpx

from backend.app.core.config import get_settings


class SpeechError(Exception):
    pass


async def transcribe_audio(
    client: httpx.AsyncClient,
    audio: bytes,
) -> str:
    key = get_settings().sarvam_api_key
    if not key:
        raise SpeechError("SARVAM_API_KEY is missing in .env")

    try:
        response = await client.post(
            "https://api.sarvam.ai/speech-to-text",
            headers={"api-subscription-key": key},
            files={"file": ("voice.webm", audio, "audio/webm")},
            data={"model": "saaras:v4", "language_code": "unknown"},
            timeout=20.0,
        )
        response.raise_for_status()
        transcript = response.json()["transcript"].strip()
        if not transcript:
            raise SpeechError("No speech was detected. Please speak clearly and try again.")
        return transcript
    except httpx.HTTPStatusError as exc:
        raise SpeechError(
            f"Sarvam rejected the request: HTTP {exc.response.status_code}"
        ) from exc
    except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
        raise SpeechError(f"Transcription failed: {type(exc).__name__}") from exc

