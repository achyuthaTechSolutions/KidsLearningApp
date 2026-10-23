import { createContext } from 'react';

/**
 * True while the player is moving the story on by itself (Puzzle mode, not paused).
 * A solved activity then presses its own Next after the child has seen "Well done!".
 */
export const AutoFinishContext = createContext(false);
