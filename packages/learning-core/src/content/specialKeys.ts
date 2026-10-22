import type { SpecialKeyContent } from '../types';

export const specialKeyData: Record<string, SpecialKeyContent> = {
  ' ': { key: 'Space', name: 'Space Bar', description: 'The space bar creates a space between words!', emoji: '⬜' },
  Enter: { key: 'Enter', name: 'Enter Key', description: 'The enter key starts a new line or confirms an action!', emoji: '↵' },
  Backspace: { key: 'Backspace', name: 'Backspace', description: 'Backspace removes the character before the cursor!', emoji: '⌫' },
  Tab: { key: 'Tab', name: 'Tab Key', description: 'The tab key moves between interactive items!', emoji: '⇥' },
  Escape: { key: 'Escape', name: 'Escape Key', description: 'The escape key closes menus and cancels actions!', emoji: '⎋' },
  Shift: { key: 'Shift', name: 'Shift Key', description: 'Hold shift to type uppercase letters!', emoji: '⇧' },
  CapsLock: { key: 'CapsLock', name: 'Caps Lock', description: 'Caps Lock makes all letters uppercase!', emoji: '🔠' },
  ArrowUp: { key: 'ArrowUp', name: 'Up Arrow', description: 'The up arrow moves the cursor up!', emoji: '⬆️' },
  ArrowDown: { key: 'ArrowDown', name: 'Down Arrow', description: 'The down arrow moves the cursor down!', emoji: '⬇️' },
  ArrowLeft: { key: 'ArrowLeft', name: 'Left Arrow', description: 'The left arrow moves the cursor left!', emoji: '⬅️' },
  ArrowRight: { key: 'ArrowRight', name: 'Right Arrow', description: 'The right arrow moves the cursor right!', emoji: '➡️' },
  Delete: { key: 'Delete', name: 'Delete Key', description: 'Delete removes the character after the cursor!', emoji: '🗑️' },
};

export const punctuationData: Record<string, SpecialKeyContent> = {
  '.': { key: '.', name: 'Period', description: 'A period marks the end of a sentence!', emoji: '.' },
  ',': { key: ',', name: 'Comma', description: 'A comma creates a small pause in a sentence!', emoji: ',' },
  '!': { key: '!', name: 'Exclamation Mark', description: 'An exclamation mark shows excitement!', emoji: '❗' },
  '?': { key: '?', name: 'Question Mark', description: 'A question mark is used when asking something!', emoji: '❓' },
  '/': { key: '/', name: 'Forward Slash', description: 'A forward slash separates things!', emoji: '/' },
  '-': { key: '-', name: 'Hyphen', description: 'A hyphen connects words together!', emoji: '-' },
  '=': { key: '=', name: 'Equals Sign', description: 'The equals sign means two things are the same!', emoji: '=' },
  '+': { key: '+', name: 'Plus Sign', description: 'The plus sign means adding things together!', emoji: '➕' },
  '[': { key: '[', name: 'Left Bracket', description: 'Brackets group things together!', emoji: '[' },
  ']': { key: ']', name: 'Right Bracket', description: 'Brackets group things together!', emoji: ']' },
  ';': { key: ';', name: 'Semicolon', description: 'A semicolon connects related sentences!', emoji: ';' },
  "'": { key: "'", name: 'Apostrophe', description: "An apostrophe shows that letters are missing or something belongs to someone!", emoji: "'" },
  '`': { key: '`', name: 'Backtick', description: 'The backtick is used in computer code!', emoji: '`' },
  '\\': { key: '\\', name: 'Backslash', description: 'The backslash is a special character in computers!', emoji: '\\' },
};
