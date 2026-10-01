import { readPage } from "./src/page-reader.js";
import { runPageAction } from "./src/action-executor.js";
import { saveExchange } from "./src/conversation-history.js";

const busyTabs = new Set();

async function handleAction(message) {
  const { tabId, pageUrl, actionId, question, conversationId } = message;

  if (!Number.isInteger(tabId) || typeof question !== "string"
      || !question.trim() || question.length > 2000) {
    throw new Error("Invalid action request.");
  }
  if (busyTabs.has(tabId)) {
    throw new Error("An action is already running on this tab.");
  }

  busyTabs.add(tabId);
  try {
    const [execution] = await chrome.scripting.executeScript({
      target: { tabId },
      func: readPage
    });
    const page = execution?.result;
    if (!page || page.url !== pageUrl) {
      throw new Error("The page changed. Please send the command again.");
    }

    const answer = await runPageAction(tabId, page.url, actionId);

    try {
      const savedId = await saveExchange(
        page, conversationId, question, answer
      );
      return { ok: true, answer, conversation_id: savedId };
    } catch (error) {
      return {
        ok: true,
        answer,
        conversation_id: conversationId,
        history_error: `The action completed, but history could not be saved: ${error.message}`
      };
    }
  } finally {
    busyTabs.delete(tabId);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "RUN_PAGE_ACTION") return false;
  if (sender.id !== chrome.runtime.id
      || sender.url !== chrome.runtime.getURL("popup/index.html")) {
    sendResponse({ ok: false, error: "Unsupported action sender." });
    return false;
  }

  handleAction(message).then(
    sendResponse,
    error => sendResponse({ ok: false, error: error.message })
  );
  return true;
});
