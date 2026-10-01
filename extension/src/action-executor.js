import { getSkeleton } from "./skeleton-reader.js";

export async function runPageAction(tabId, pageUrl, actionId) {
  const skeleton = await getSkeleton(pageUrl);
  if (!skeleton.actions.some(action => action.id === actionId)) {
    throw new Error("The selected action is not in the supplied page skeleton.");
  }

  const [execution] = await chrome.scripting.executeScript({
    target: { tabId },
    func: executeAllowedAction,
    args: [skeleton, actionId]
  });

  const outcome = execution?.result;
  if (!outcome?.ok) {
    throw new Error(outcome?.message || "Action could not be verified.");
  }

  if (outcome.goBack) {
    await chrome.tabs.goBack(tabId);
  }

  if (outcome.navigateUrl) {
    await chrome.tabs.update(tabId, { url: outcome.navigateUrl });
  }
  return outcome.message;
}

async function executeAllowedAction(skeleton, actionId) {
  if (location.origin !== skeleton.origin || location.pathname !== skeleton.pathname) {
    return { ok: false, message: "The page changed. Please send the command again." };
  }

  const action = skeleton.actions.find(item => item.id === actionId);
  if (!action) return { ok: false, message: "This action is not in the supplied page skeleton." };

  if (action.type === "scroll_top") {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      ok: window.scrollY < 5,
      message: window.scrollY < 5
        ? "Scrolled to the top of the page."
        : "Could not verify scrolling to the top."
    };
  }

  if (action.type === "back") {
    if (history.length <= 1) {
      return { ok: false, message: "No previous browser history entry is available." };
    }
    return {
      ok: true,
      goBack: true,
      message: "Sent the browser Back command."
    };
  }

  const targetUrl = new URL(action.href, location.href);
  const normalize = value => value.replace(/\s+/g, " ").trim().toLowerCase();

  const matches = [...document.querySelectorAll("a[href]")].filter(element => {
    const style = getComputedStyle(element);
    const label = normalize(element.textContent);
    const expected = normalize(action.label);
    return element.href === targetUrl.href
      && (label === expected || (
        action.type === "external"
        && [expected + " ↗", "open " + expected + " ↗"].includes(label)
      ))
      && element.getClientRects().length > 0
      && style.visibility !== "hidden"
      && style.display !== "none";
  });

  if (action.type === "external") {
    if (!matches.length || targetUrl.protocol !== "https:") {
      return { ok: false, message: "The allowed external link was not found on this page." };
    }
    return {
      ok: true,
      navigateUrl: targetUrl.href,
      message: `${action.label} navigation started.`
    };
  }

  if (matches.length !== 1) {
    return {
      ok: false,
      message: `Expected one visible "${action.label}" link; found ${matches.length}.`
    };
  }

  const section = document.getElementById(targetUrl.hash.slice(1));
  if (!section) {
    return { ok: false, message: "The destination section was not found." };
  }

  matches[0].click();
  await new Promise(resolve => setTimeout(resolve, 700));
  const rect = section.getBoundingClientRect();
  const visible = rect.top < innerHeight && rect.bottom > 0;

  return {
    ok: visible,
    message: visible
      ? `${action.label} section opened.`
      : `${action.label} was clicked, but scrolling could not be verified.`
  };
}



