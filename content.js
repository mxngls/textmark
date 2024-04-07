// import { sanitize } from "dompurify";

var MARK_SET = false;
var INLINE_ELEMENTS = [
  "A",
  "ABBR",
  "B",
  "BDI",
  "BDO",
  "CITE",
  "CODE",
  "DEL",
  "EM",
  "EM",
  "I",
  "INS",
  "KBD",
  "Q",
  "RUBY",
  "S",
  "SAMP",
  "SMALL",
  "STRONG",
  "SUB",
  "SUP",
  "TIME",
  "VAR",
];
var BLOCK_ELEMENTS = ["H1", "H2", "H3", "H4", "H5", "H6", "HR", "PRE"];
var ALLOWED_ATTRIBUTES = ["hidden", "href"];

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
  if (mark && event.target !== document.getElementById("saveMark")) {
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
    return;
  }

  // const sanitizedSel = selection.toString().trim();
  // TODO: Figure out how to properly import ESM modules
  // const sanitizedSel = sanitize(selection);

  const mark = document.createElement("span");
  const range = selection.getRangeAt(0);
  const savedRange = range.cloneRange();

  // When selecting a whole paragraph via double-clicking then the
  // icon gets throw of and ends up not on the right, but on the left
  // hand-side. This fixes this.
  if (range.startOffset === 0 && range.endOffset === 0) {
    range.setEnd(
      range.startContainer.parentNode,
      range.startContainer.parentNode.childNodes.length,
    );
  }

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

  MARK_SET = false;
}

function createSaveMarkButton(selection) {
  const saveMarkButton = document.createElement("button");

  saveMarkButton.id = "saveMark";
  saveMarkButton.addEventListener("click", async (_event) => {
    const URL = window.location.href;
    console.log(URL, "\n");

    const contents = getSelectedHTML(selection);

    const container = document.createElement("div");
    container.appendChild(contents);
    console.log(container);

    removeMark(document.getElementById("mark"));
  });

  return saveMarkButton;
}

// TODO: Add line breaks between captured nodes of the commmon ancestor
function getSelectedHTML(selection) {
  if (selection.type !== "Range") {
    console.log("selection not of type range!");
    return;
  }

  const children = [];
  const doc = document.createDocumentFragment();

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const ancestor = range.commonAncestorContainer;
    const start = range.startOffset;
    const end = range.endOffset;

    const walker = document.createTreeWalker(
      ancestor,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );

    const ancestorChildren = Array.from(ancestor.childNodes);

    console.log("ancestorChildren:", ancestorChildren);

    let container = null;

    while (walker.nextNode()) {
      let child = walker.currentNode;
      let childToAppend = null;

      console.log(child);

      if (!selection.containsNode(child, true)) continue;

      if (child.id === "mark") {
        child.parentNode.removeChild(child);
      }

      if (child.nodeType === Node.TEXT_NODE) {
        childToAppend =
          range.startContainer === child
            ? child.textContent.slice(start)
            : child === range.endContainer
              ? child.textContent.slice(0, end)
              : child.textContent;
      } else if (
        child.nodeType === Node.ELEMENT_NODE &&
        (INLINE_ELEMENTS.includes(child.tagName) ||
          BLOCK_ELEMENTS.includes(child.tagName))
      ) {
        // NOTE: Without cloning the element it gets removed as soon as
        // we append to the document fragment created above
        const link = child.cloneNode(true);
        childToAppend = link;

        // Make sure don't grab any text nodes that resides in one of
        // the captured element nodes as we already got these
        walker.nextNode();
      } else if (
        child.tagName !== "SPAN" &&
        ancestorChildren.some(
          (node, index) =>
            node === child &&
            index !== 0 &&
            index !== ancestorChildren.length - 1,
        )
      ) {
        container = !container ? document.createElement("p") : null;
      }

      if (childToAppend) {
        const child_ = child.cloneNode(true);
        if (container) {
          container.appendChild(child_);
          children.push(container);
        } else {
          children.push(child_);
        }
      }
    }
  }

  children.forEach((node) => doc.append(node));

  return doc;
}

function getNextNode(node) {
  if (node.nextElementSibling) {
    return node.nextElementSibling;
  } else if (node.hasChildNodes()) {
    return node.firstChild;
  }

  return false;
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
