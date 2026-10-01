import { getSkeleton } from "./skeleton-reader.js";

export async function routePageInput(pageUrl, command) {
  let skeleton = null;
  const skeletonUrl = chrome.runtime.getURL("page-skeletons/portfolio.json");
  const skeletonResponse = await fetch(skeletonUrl);
  if (!skeletonResponse.ok) throw new Error("Skeleton could not be loaded.");
  const candidate = await skeletonResponse.json();
  const current = new URL(pageUrl);

  if (current.origin === candidate.origin && current.pathname === candidate.pathname) {
    skeleton = candidate;
  }

  const response = await fetch("http://127.0.0.1:8000/api/actions/select", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      command,
      page_url: pageUrl,
      actions: (skeleton?.actions || []).map(({ id, label, description }) => ({
        id, label, description
      }))
    })
  });

  const decision = await response.json();
  if (!response.ok) throw new Error(decision.detail || `HTTP ${response.status}`);
  return decision;
}
