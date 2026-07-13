# Skill: Fix a Game Bug

## Debugging Checklist

1. **Identify the game** in `app/components/games/` directory
2. **Check role**: Is it a stage, controller, or solo game? (check `role` prop usage)
3. **Check hook**:
   - Stage games use `useStageGame<T>()` — processes `playerActions`
   - Controller games use `useControllerGame<T>()` — calls `sendAction`
   - Solo games use local state only

4. **Check server engine** (if applicable):
   - SDK definition in `lib/games/definitions/GameName.ts`
   - Fallback in `lib/games/engine.ts`

5. **Common bugs**:
   - `playerActions.length === 0` guard missing in useEffect
   - State read outside `setState(prev => ...)` callback (stale closure)
   - Missing `clearActions()` after processing
   - Version conflict (409) — check version locking in API route
   - Wrong hook — stage games MUST use `useStageGame` not `useMultiplayerGame`

6. **Fix + Verify**:
   - `npm test` 
   - `npm run lint`
   - `npm run build`
