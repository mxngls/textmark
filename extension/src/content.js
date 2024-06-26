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
  saveMarkButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const URL = window.location.href;
    console.log(URL, "\n");

    const contents = getSelectedHTML(selection);

    console.log("cloned contents:", selection.getRangeAt(0).cloneContents());
    console.log("selection:", contents);
    console.log("text:", selection.toString());

    removeMark(document.getElementById("mark"));
  });

  return saveMarkButton;
}

function getSelectedHTML(selection) {
  if (selection.type !== "Range") {
    console.log("selection not of type range!");
    return;
  }

  const doc = document.createDocumentFragment();

  for (let i = 0; i < selection.rangeCount; i++) {
    const range = selection.getRangeAt(i);
    const contents = range.cloneContents();
    const root = document.createElement("div");
    root.style.borderBottom = "1px dotted dimgrey";
    root.style.padding = "1rem";

    const ancestor = range.commonAncestorContainer;
    const container = document.createElement(ancestor.tagName);

    container.appendChild(contents);
    root.appendChild(container);

    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    );

    const toRemove = [];

    while (walker.nextNode()) {
      let child = walker.currentNode;

      if (child.nodeType === Node.ELEMENT_NODE) {
        // Copied nodes should be "clean" so we remove unwanted
        // attributes. For now I can only think of the class attribute,
        // but there may be more. I have yet not decided if it's better
        // to preserve inline styles or not. Perserving them works great
        // for Wikipedia, but less for the dozen other websites I
        // tested.
        child.removeAttribute("class");
        child.removeAttribute("style");

        if (child.tagName === "A") {
          if (isRelativeRef(child.href)) {
            child.href = new URL(child.href, document.baseURI);
          }
        } else if (child.tagName === "IMG" || child.tagName === "svg") {
          toRemove.push(child);
        }
      }
    }

    toRemove.forEach((node) => node.remove());

    doc.append(root);

    return doc;
  }
}

function isRelativeRef(href) {
  return (
    new URL(document.baseURI).origin === new URL(href, document.baseURI).origin
  );
}
