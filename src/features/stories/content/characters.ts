import type { CharacterId, Localized } from '../engine/types';

export interface CharacterDef {
  id: CharacterId;
  name: Localized;
  /** Development artwork: a bundled Fluent Emoji picture (MIT). Final character art can replace it by id. */
  emoji: string;
}

export const characters: Record<CharacterId, CharacterDef> = {
  narrator: { id: 'narrator', emoji: '📖', name: { en: 'Storyteller', te: 'కథ చెప్పేవారు', hi: 'कहानीकार' } },
  kalu: { id: 'kalu', emoji: '🐦‍⬛', name: { en: 'Kalu the Crow', te: 'కాలూ కాకి', hi: 'कालू कौआ' } },
  rabbit: { id: 'rabbit', emoji: '🐰', name: { en: 'Clever Rabbit', te: 'తెలివైన కుందేలు', hi: 'चतुर खरगोश' } },
  lion: { id: 'lion', emoji: '🦁', name: { en: 'Lion', te: 'సింహం', hi: 'शेर' } },
  mouse: { id: 'mouse', emoji: '🐭', name: { en: 'Little Mouse', te: 'చిట్టి ఎలుక', hi: 'नन्हा चूहा' } },
  monkey: { id: 'monkey', emoji: '🐒', name: { en: 'Monkey', te: 'కోతి', hi: 'बंदर' } },
  crocodile: { id: 'crocodile', emoji: '🐊', name: { en: 'Crocodile', te: 'మొసలి', hi: 'मगरमच्छ' } },
  'dove-king': { id: 'dove-king', emoji: '🕊️', name: { en: 'Chitragriva, the Dove King', te: 'పావురాల రాజు చిత్రగ్రీవుడు', hi: 'कबूतरों के राजा चित्रग्रीव' } },
  doves: { id: 'doves', emoji: '🐦', name: { en: 'The Doves', te: 'పావురాలు', hi: 'कबूतर' } },
  deer: { id: 'deer', emoji: '🦌', name: { en: 'Deer', te: 'జింక', hi: 'हिरण' } },
};

export const characterIds = Object.keys(characters);
