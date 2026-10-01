import { conversationKey, rememberConversation, saveExchange } from "../src/conversation-history.js";
import { renderMessage } from "../src/message-renderer.js";
import { setupVoiceButton } from "../src/voice-input.js";
import { readPage } from "../src/page-reader.js";
import { routePageInput } from "../src/intent-router.js";

const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const messages = document.querySelector("#messages");
const status = document.querySelector("#status");
const pageLabel = document.querySelector("#page");
const sendButton = form.querySelector('button[type="submit"]');
let activeTab;
let conversationId = null;
let pageUrl = "";

function addMessage(role, content) {
  const item = document.createElement("div");
  item.className = `message ${role}`;
  renderMessage(item, content);
  messages.append(item);
  messages.scrollTop = messages.scrollHeight;
}

async function getPage() {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: readPage
  });
  return result.result;
}

async function initialize() {
  [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id || !activeTab.url?.startsWith("http")) {
    throw new Error("Open a normal website to use this assistant.");
  }

  const page = await getPage();
  pageUrl = page.url;
  pageLabel.textContent = `${activeTab.title || "Current page"} — ${pageUrl}`;

  const key = conversationKey(pageUrl);
  const legacyKey = `conversation:${pageUrl}`;
  const saved = await chrome.storage.local.get([key, legacyKey]);
  conversationId = saved[key] || saved[legacyKey] || null;
  if (conversationId) await rememberConversation(pageUrl, conversationId);

  if (conversationId) {
    const response = await fetch(
      `http://127.0.0.1:8000/api/conversations/${conversationId}`
    );
    if (response.ok) {
      const history = await response.json();
      history.messages.forEach(item => addMessage(item.role, item.content));
    } else {
      conversationId = null;
    }
  }
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;

  sendButton.disabled = true;
  status.textContent = "";
  addMessage("user", question);
  questionInput.value = "";

  try {
    const page = await getPage();

    const decision = await routePageInput(page.url, question);

    if (decision.intent === "clarify") {
      const answer = decision.message || "Which action would you like me to perform?";
      addMessage("assistant", answer);
      conversationId = await saveExchange(page, conversationId, question, answer);
      return;
    }

    if (decision.intent === "action") {
      const result = await chrome.runtime.sendMessage({
        type: "RUN_PAGE_ACTION",
        tabId: activeTab.id,
        pageUrl: page.url,
        actionId: decision.action_id,
        question,
        conversationId
      });
      if (!result?.ok) {
        throw new Error(result?.error || "Action execution failed.");
      }
      addMessage("assistant", result.answer);
      conversationId = result.conversation_id;
      if (result.history_error) status.textContent = result.history_error;
      return;
    }

    const response = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
        page_url: page.url,
        page_content: page.content
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `HTTP ${response.status}`);

    addMessage("assistant", data.answer);
    conversationId = data.conversation_id;
    pageUrl = page.url;
    await rememberConversation(pageUrl, conversationId);
  } catch (error) {
    status.textContent = error.message;
  } finally {
    sendButton.disabled = false;
    questionInput.focus();
  }
});

initialize().catch(error => {
  status.textContent = error.message;
  pageLabel.textContent = "Page unavailable";
  sendButton.disabled = true;
});





setupVoiceButton({
  button: document.querySelector("#mic"),
  input: questionInput,
  form,
  status,
  sendButton
});




