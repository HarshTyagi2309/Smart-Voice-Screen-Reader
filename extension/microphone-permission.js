document.querySelector("#allow").addEventListener("click", async () => {
  const status = document.querySelector("#status");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    status.textContent = "Permission granted. Close this tab and use Mic on your portfolio.";
  } catch (error) {
    status.textContent = `${error.name}: ${error.message}`;
  }
});
