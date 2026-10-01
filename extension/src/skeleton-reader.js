export async function getSkeleton(pageUrl) {
  const response = await fetch(
    chrome.runtime.getURL("page-skeletons/portfolio.json")
  );
  if (!response.ok) throw new Error("Page skeleton could not be loaded.");

  const skeleton = await response.json();
  const current = new URL(pageUrl);
  if (current.origin !== skeleton.origin || current.pathname !== skeleton.pathname) {
    throw new Error("No action skeleton has been supplied for this page.");
  }
  return skeleton;
}

