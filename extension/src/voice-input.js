export function setupVoiceButton({ button, input, form, status, sendButton }) {
  let recorder = null;
  let stream = null;
  let timer = null;
  let starting = false;

  button.addEventListener("click", async () => {
    if (recorder?.state === "recording") {
      recorder.stop();
      return;
    }
    if (starting || sendButton.disabled) return;

    starting = true;
    status.textContent = "";
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks = [];

      recorder.addEventListener("dataavailable", event => {
        if (event.data.size) chunks.push(event.data);
      });

      recorder.addEventListener("stop", async () => {
        clearTimeout(timer);
        stream?.getTracks().forEach(track => track.stop());
        button.textContent = "Mic";
        button.classList.remove("recording");
        button.disabled = true;
        sendButton.disabled = true;
        status.textContent = "Transcribing your voice…";

        try {
          const audio = new Blob(chunks, { type: "audio/webm" });
          const body = new FormData();
          body.append("file", audio, "voice.webm");

          const response = await fetch(
            "http://127.0.0.1:8000/api/voice/transcribe",
            { method: "POST", body }
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);

          input.value = data.transcript;
          status.textContent = "";
          sendButton.disabled = false;
          form.requestSubmit();
        } catch (error) {
          status.textContent = error.message;
          sendButton.disabled = false;
        } finally {
          button.disabled = false;
        }
      });

      recorder.start();
      button.textContent = "Stop";
      button.classList.add("recording");
      status.textContent = "Listening… Click Stop when you finish speaking.";
      timer = setTimeout(() => {
        if (recorder?.state === "recording") recorder.stop();
      }, 15000);
    } catch (error) {
      stream?.getTracks().forEach(track => track.stop());
      status.textContent = error.name === "NotAllowedError"
        ? "Please allow microphone access."
        : `Microphone error: ${error.message}`;
    } finally {
      starting = false;
    }
  });

  window.addEventListener("pagehide", () => {
    clearTimeout(timer);
    stream?.getTracks().forEach(track => track.stop());
  });
}


