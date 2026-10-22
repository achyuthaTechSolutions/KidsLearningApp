import type { LetterContent } from '../types';

export const alphabetData: Record<string, LetterContent> = {
  A: { letter: 'A', uppercase: 'A', lowercase: 'a', word: 'Apple', description: 'A is for Apple!', phonetic: 'ah', emoji: '🍎' },
  B: { letter: 'B', uppercase: 'B', lowercase: 'b', word: 'Ball', description: 'B is for Ball!', phonetic: 'buh', emoji: '⚽' },
  C: { letter: 'C', uppercase: 'C', lowercase: 'c', word: 'Cat', description: 'C is for Cat!', phonetic: 'kuh', emoji: '🐱' },
  D: { letter: 'D', uppercase: 'D', lowercase: 'd', word: 'Dog', description: 'D is for Dog!', phonetic: 'duh', emoji: '🐕' },
  E: { letter: 'E', uppercase: 'E', lowercase: 'e', word: 'Elephant', description: 'E is for Elephant!', phonetic: 'eh', emoji: '🐘' },
  F: { letter: 'F', uppercase: 'F', lowercase: 'f', word: 'Fish', description: 'F is for Fish!', phonetic: 'fuh', emoji: '🐟' },
  G: { letter: 'G', uppercase: 'G', lowercase: 'g', word: 'Grapes', description: 'G is for Grapes!', phonetic: 'guh', emoji: '🍇' },
  H: { letter: 'H', uppercase: 'H', lowercase: 'h', word: 'House', description: 'H is for House!', phonetic: 'huh', emoji: '🏠' },
  I: { letter: 'I', uppercase: 'I', lowercase: 'i', word: 'Ice cream', description: 'I is for Ice cream!', phonetic: 'ih', emoji: '🍦' },
  J: { letter: 'J', uppercase: 'J', lowercase: 'j', word: 'Juice', description: 'J is for Juice!', phonetic: 'juh', emoji: '🧃' },
  K: { letter: 'K', uppercase: 'K', lowercase: 'k', word: 'Kite', description: 'K is for Kite!', phonetic: 'kuh', emoji: '🪁' },
  L: { letter: 'L', uppercase: 'L', lowercase: 'l', word: 'Lion', description: 'L is for Lion!', phonetic: 'luh', emoji: '🦁' },
  M: { letter: 'M', uppercase: 'M', lowercase: 'm', word: 'Moon', description: 'M is for Moon!', phonetic: 'muh', emoji: '🌙' },
  N: { letter: 'N', uppercase: 'N', lowercase: 'n', word: 'Nest', description: 'N is for Nest!', phonetic: 'nuh', emoji: '🪹' },
  O: { letter: 'O', uppercase: 'O', lowercase: 'o', word: 'Orange', description: 'O is for Orange!', phonetic: 'oh', emoji: '🍊' },
  P: { letter: 'P', uppercase: 'P', lowercase: 'p', word: 'Penguin', description: 'P is for Penguin!', phonetic: 'puh', emoji: '🐧' },
  Q: { letter: 'Q', uppercase: 'Q', lowercase: 'q', word: 'Queen', description: 'Q is for Queen!', phonetic: 'kwuh', emoji: '👑' },
  R: { letter: 'R', uppercase: 'R', lowercase: 'r', word: 'Rabbit', description: 'R is for Rabbit!', phonetic: 'ruh', emoji: '🐰' },
  S: { letter: 'S', uppercase: 'S', lowercase: 's', word: 'Sun', description: 'S is for Sun!', phonetic: 'sss', emoji: '☀️' },
  T: { letter: 'T', uppercase: 'T', lowercase: 't', word: 'Tiger', description: 'T is for Tiger!', phonetic: 'tuh', emoji: '🐯' },
  U: { letter: 'U', uppercase: 'U', lowercase: 'u', word: 'Umbrella', description: 'U is for Umbrella!', phonetic: 'uh', emoji: '☂️' },
  V: { letter: 'V', uppercase: 'V', lowercase: 'v', word: 'Van', description: 'V is for Van!', phonetic: 'vuh', emoji: '🚐' },
  W: { letter: 'W', uppercase: 'W', lowercase: 'w', word: 'Whale', description: 'W is for Whale!', phonetic: 'wuh', emoji: '🐋' },
  X: { letter: 'X', uppercase: 'X', lowercase: 'x', word: 'Xylophone', description: 'X is for Xylophone!', phonetic: 'ks', emoji: '🎵' },
  Y: { letter: 'Y', uppercase: 'Y', lowercase: 'y', word: 'Yo-yo', description: 'Y is for Yo-yo!', phonetic: 'yuh', emoji: '🪀' },
  Z: { letter: 'Z', uppercase: 'Z', lowercase: 'z', word: 'Zebra', description: 'Z is for Zebra!', phonetic: 'zuh', emoji: '🦓' },
};

export const letterOrder = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
