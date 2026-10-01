export function conversationKey(pageUrl) {
  const url = new URL(pageUrl);
  url.hash = "";
  return `conversation:${url.href}`;
}

export async function rememberConversation(pageUrl, conversationId) {
  await chrome.storage.local.set({
    [conversationKey(pageUrl)]: conversationId
  });
}

export async function saveExchange(page, conversationId, question, answer) {
  const response = await fetch(
    "http://127.0.0.1:8000/api/conversations/exchanges",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        question,
        answer,
        page_url: page.url,
        page_content: page.content
      })
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || `History save failed: HTTP ${response.status}`);
  }
  await rememberConversation(page.url, data.conversation_id);
  return data.conversation_id;
}
