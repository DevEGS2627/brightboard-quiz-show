<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Quiz state lives in `src/quiz/store.ts` (pure rule functions + a store synced across tabs via localStorage/BroadcastChannel); keep rules pure so they stay testable and can later move to a database.
- Colour themes are `[data-theme]` blocks in `src/styles.css` listed in `src/quiz/themes.ts`; add a theme in both places so Admin can offer it.
- Presentation (`/present`) shows only the next needed action; everything else goes in its 3-dot menu.
