import { createAtomValueTap, createFunctionTap, type MatchingContext } from '@owebeeone/grip-react';
import { DESCRIPTION, DESCRIPTION_SLUG, DESCRIPTION_STATS, DESCRIPTION_TAP } from './grips';

export function initDescriptionEditor(context: MatchingContext): void {
  const home = context.getGripHomeContext();
  home.registerTap(createAtomValueTap(DESCRIPTION, {
    initial: 'EDIT THIS SENTENCE IN THE MIDDLE', handleGrip: DESCRIPTION_TAP,
  }));
  home.registerTap(createFunctionTap<
    { slug: typeof DESCRIPTION_SLUG; statistics: typeof DESCRIPTION_STATS },
    { description: typeof DESCRIPTION }
  >({
    provides: [DESCRIPTION_SLUG, DESCRIPTION_STATS],
    homeParamGrips: [DESCRIPTION],
    compute: ({ getHomeParam }) => {
      const text = getHomeParam(DESCRIPTION) ?? '';
      const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
      const characters = Array.from(text).length;
      const slug = text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return new Map([
        [DESCRIPTION_SLUG, slug],
        [DESCRIPTION_STATS, `${words} ${words === 1 ? 'word' : 'words'} · ${characters} ${characters === 1 ? 'character' : 'characters'}`],
      ]);
    },
  }));
}
