// import { sanitize } from "dompurify";

var MARK_SET = false;

document.addEventListener("mouseup", (event) => {
  if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")
    return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount < 1 || sel.toString().length < 1) return;

  const mark = setMark(sel);
  const saveMarkButton = createSaveMarkButton(sel);

  if (mark) {
    mark.appendChild(saveMarkButton);
    saveMarkButton.focus();
  }
});

document.addEventListener("mousedown", (event) => {
  const mark = document.getElementById("mark");
  if (mark && event.target.id !== document.getElementById("saveMark")) {
    removeMark(mark);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const mark = document.getElementById("mark");
  if (mark && event.target.id !== document.getElementById("saveMark")) {
    removeMark(mark);
  }
});

// Set a new mark if no mark is present yet
function setMark(selection) {
  if (MARK_SET) {
    console.log("mark already set!");
    return;
  }

  // const sanitizedSel = selection.toString().trim();
  // TODO: Figure out how to properly import ESM modules
  // const sanitizedSel = sanitize(selection);

  const mark = document.createElement("span");
  const range = selection.getRangeAt(0);
  const savedRange = range.cloneRange();

  mark.id = "mark";

  // Set a mark
  range.collapse(false);
  range.insertNode(mark);
  MARK_SET = true;

  // Restore the current selection
  selection.removeAllRanges();
  selection.addRange(savedRange);

  return mark;
}

function removeMark(mark) {
  if (!MARK_SET || !mark) {
    return;
  }

  const parent = mark.parentNode;
  parent.removeChild(mark);
  window.getSelection().empty();

  MARK_SET = false;
}

function createSaveMarkButton(selection) {
  const saveMarkButton = document.createElement("button");

  saveMarkButton.id = "saveMark";
  saveMarkButton.addEventListener("click", (event) => {
    // const immediateSelected = getMainChunk(selection);
    // console.log(immediateSelected);

    console.log(selection.toString().trim());

    removeMark(event.target.parentNode);
  });

  return saveMarkButton;
}

// Determines which element from all elements a given selection spans
// contains most of the text currently highlighted. Then we simply
// return only that part of the selection that lies withing said element
// or it's children.
function getMainChunk(selection) {
  if (selection.type !== "Range") {
    console.log("selection not of type range!");
    return;
  }

  const children = {};

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const ancestor = range.commonAncestorContainer;

    if (!ancestor.children) return ancestor;

    for (let c = 0; c < ancestor.children.length; c++) {
      let child = ancestor.children[c];
      if (selection.containsNode(child, true)) {
        const childText = getFullText(child).trim();
        children[c] = childText;
      }
    }
  }

  return children;
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
