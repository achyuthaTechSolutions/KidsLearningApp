# Looks

Parent Settings → **Appearance → Look** switches the whole app between four looks, so a family can try each redesign in the real app before choosing one. Classic is the default, so nothing changes until a grown-up picks a look. Progress is the same in every look.

| Look | Feel | Avi | Fonts |
| --- | --- | --- | --- |
| Classic | The original colourful design | Violet owl in a cap | Fredoka, Nunito |
| Storybook Garden | Warm cream paper, deep indigo text, marigold and leaf green | Leaf-green owl | Baloo 2, Nunito |
| Bright Blocks | Flat bright blocks with thick ink outlines, for children who cannot read yet | Round sunny friend | Fredoka, Nunito |
| Adventure Map | Sea and sand; places are islands joined by a path | Little elephant explorer | Sniglet, Lexend |

The three new looks come from the redesign canvas (directions A, B, and C).

## What a look changes

- **Theme** (`theme/theme.ts`, `themeFor(mode, look)`): background, surfaces, text, primary colour, corner radius, and button and card style. Classic uses chunky lips; Bright Blocks uses a 3 px ink outline with a hard offset shadow; Garden and Map are flat and soft.
- **Fonts:** `tokens.fonts` reads the CSS variables `--kl-font-display` and `--kl-font-body`, which `applyLookFonts` sets, so every screen uses the look's fonts. Baloo 2, Sniglet, and Lexend load only when their look is first chosen.
- **Avi** (`components/ui/Mascot.tsx`, `AviLooks.tsx`): every `<Mascot>` draws the look's Avi, with the same moods (happy, cheer, think) and waving.
- **Home** (`features/home/looks/`):
  - Garden: Avi's greeting, a "Keep reading" story card, four picture tiles, today's questions, and smaller tiles for everything else.
  - Blocks: four huge one-word blocks, the story to carry on, today's stars, and smaller blocks.
  - Map: four islands (Story Cove, Letter Hill, Number Bay, Game Island) with Avi on the island of the last activity, "Today's trip with Avi", and more places.
- **Games list** (`features/learning-games/hubs/`): every game and quiz, with Letters / Numbers / Think / Explore filters and each child's status (Level N, played, or New).
  - Garden: Avi's pick, then small picture tiles.
  - Blocks: big blocks with one word each.
  - Map: a trail of stops, marked done, next stop, or not tried yet.
- **Phone bottom menu** (`components/layout/LookBottomBar.tsx`):
  - Garden: Home, Stories, Play, Stars, More.
  - Map: Map, Stories, Games, Badges, More.
  - Blocks: icons only, with the grown-ups area behind a lock. A tap shows "Grown-ups: press and hold"; holding for one second opens Parent Settings. A keyboard press opens it at once.

## What a look does not change

- **Inside a game or activity,** the screen keeps its own colourful world colours, which are already contrast-checked. Only the fonts, buttons, and Avi follow the look.
- **Dark mode:** every look keeps the Classic dark colours, and changes only shapes and fonts.
- **The Story Time player** is unchanged in this pass, because PR #8 (Story and Puzzle modes) changes it.

## Accessibility

- `e2e/looks.spec.ts` runs axe (WCAG 2.1 AA, serious and critical) on Home and Games in each look, on desktop and Pixel 7, and checks there is no sideways scrolling.
- One canvas colour failed axe: the leaf green (#3F8F5B) behind small pale text, at 3.4:1. "Avi's pick" uses the darker leaf (#2F7446) instead.
