/**
 * Copyright (c) 2016 The xterm.js authors. All rights reserved.
 * @license MIT
 */

import { ISelectionService } from 'browser/services/Services';

/**
 * Prepares text to be pasted into the terminal by normalizing the line endings
 * @param text The pasted text that needs processing before inserting into the terminal
 */
export function prepareTextForTerminal(text: string): string {
  return text.replace(/\r?\n/g, '\r');
}

/**
 * Bracket text for paste, if necessary, as per https://cirw.in/blog/bracketed-paste
 * @param text The pasted text to bracket
 */
export function bracketTextForPaste(text: string, bracketedPasteMode: boolean): string {
  if (bracketedPasteMode) {
    return '\x1b[200~' + text + '\x1b[201~';
  }
  return text;
}

/**
 * Binds copy functionality to the given terminal.
 * @param ev The original copy event to be handled
 */
export function copyHandler(ev: ClipboardEvent, selectionService: ISelectionService): void {
  ev.clipboardData.setData('text/plain', selectionService.selectionText);
  // Prevent or the original text will be copied.
  ev.preventDefault();
}

/**
 * Redirect the clipboard's data to the terminal's input handler.
 * @param ev The original paste event to be handled
 * @param term The terminal on which to apply the handled paste event
 */
export function pasteHandler(ev: ClipboardEvent, textarea: HTMLTextAreaElement, bracketedPasteMode: boolean, triggerUserInput: (data: string) => void): void {
  ev.stopPropagation();

  let text: string;

  const dispatchPaste = function(text: string): void {
    text = prepareTextForTerminal(text);
    text = bracketTextForPaste(text, bracketedPasteMode);
    triggerUserInput(text);
    textarea.value = '';
  };

  if (ev.clipboardData) {
    text = ev.clipboardData.getData('text/plain');
    dispatchPaste(text);
  }
}

/**
 * Moves the textarea under the mouse cursor and focuses it.
 * @param ev The original right click event to be handled.
 * @param textarea The terminal's textarea.
 */
export function moveTextAreaUnderMouseCursor(ev: MouseEvent, textarea: HTMLTextAreaElement, screenElement: HTMLElement): void {

  // Calculate textarea position relative to the screen element
  const pos = screenElement.getBoundingClientRect();
  const left = ev.clientX - pos.left - 10;
  const top = ev.clientY - pos.top - 10;

  // Bring textarea at the cursor position
  textarea.style.position = 'absolute';
  textarea.style.width = '20px';
  textarea.style.height = '20px';
  textarea.style.left = `${left}px`;
  textarea.style.top = `${top}px`;
  textarea.style.zIndex = '1000';

  textarea.focus();

  // Reset the terminal textarea's styling
  // Timeout needs to be long enough for click event to be handled.
  setTimeout(() => {
    textarea.style.position = null;
    textarea.style.width = null;
    textarea.style.height = null;
    textarea.style.left = null;
    textarea.style.top = null;
    textarea.style.zIndex = null;
  }, 200);
}

/**
 * Bind to right-click event and allow right-click copy and paste.
 * @param ev The original right click event to be handled.
 * @param textarea The terminal's textarea.
 * @param selectionService The terminal's selection manager.
 * @param shouldSelectWord If true and there is no selection the current word will be selected
 */
export function rightClickHandler(ev: MouseEvent, textarea: HTMLTextAreaElement, screenElement: HTMLElement, selectionService: ISelectionService, shouldSelectWord: boolean): void {
  moveTextAreaUnderMouseCursor(ev, textarea, screenElement);

  if (shouldSelectWord && !selectionService.isClickInSelection(ev)) {
    selectionService.selectWordAtCursor(ev);
  }

  // Get textarea ready to copy from the context menu
  textarea.value = selectionService.selectionText;
  textarea.select();
}
