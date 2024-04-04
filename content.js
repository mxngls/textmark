// import { sanitize } from "dompurify";

// On mouseup check if there is text currently selected
document.addEventListener("click", (_event) => {
  let mark;
  if ((mark = document.getElementById("mark"))) {
    removeMark(mark);
    return;
  } else mark = document.createElement("span");

  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  const rangeCount = selection.rangeCount;

  if (selection.toString().length < 1 || rangeCount < 1) return;

  // const sanitizedSel = selection.toString().trim();
  // TODO: Figure out how to properly import ESM modules
  // const sanitizedSel = sanitize(selection);

  mark.id = "mark";

  const saveMarkButton = document.createElement("button");
  saveMarkButton.id = "saveMark";
  saveMarkButton.textContent = "mark";
  saveMarkButton.addEventListener("click", (event) => {
    const immediateSelected = getMainChunk(selection);
  });

  mark.appendChild(saveMarkButton);

  const savedRange = range.cloneRange();

  range.collapse(false);
  range.insertNode(mark);
  selection.removeAllRanges();
  selection.addRange(savedRange);

  sel = selection;
});

function removeMark(mark) {
  if (!mark) return;
  const parent = mark.parentNode;
  parent.removeChild(mark);
}

// Determines which element from all elements a given selection spans
// contains most of the text currently highlighted. Then we simply
// return only that part of the selection that lies withing said element
// or it's children.
function getMainChunk(selection) {
  if (selection.type !== "Range") return;

  const children = {};

  console.log("selection", selection);
  console.log("selection count:", selection.rangeCount);

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const ancestor = range.commonAncestorContainer;

    let t = 0;
    for (const child of ancestor.children) {
      if (selection.containsNode(child, true)) {
        children[t++] = getFullText(child);
      }
    }
  }

  console.log("children:", children);
}

// Recursively get the full text content of an element and its children
function getFullText(element) {
  let text = "";

  for (let node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      text += getFullText(node);
    }
  }

  return text;
}
