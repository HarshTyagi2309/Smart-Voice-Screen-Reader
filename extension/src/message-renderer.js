export function renderMessage(element, content) {
  element.replaceChildren();
  const pattern = /\*\*(.+?)\*\*/gs;
  let position = 0;

  for (const match of content.matchAll(pattern)) {
    element.append(document.createTextNode(
      content.slice(position, match.index)
    ));

    const bold = document.createElement("strong");
    bold.textContent = match[1];
    element.append(bold);

    position = match.index + match[0].length;
  }

  element.append(document.createTextNode(content.slice(position)));
}
