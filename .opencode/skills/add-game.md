# Skill: Add a New Game

## Workflow

1. **Create game component** at `app/components/games/GameName.tsx`:
   - Export default function with signature `{ partyId, sessionId, onSave, role }`
   - Import `useStageGame`/`useControllerGame` for multiplayer
   - Call `onSave(numericScore)` at game end

2. **Add server engine** (if server-authoritative):
   - Create `lib/games/definitions/GameName.ts` with `defineGame<State>({...})`
   - Register in `lib/games/sdk.ts`

3. **Add i18n keys** in `lib/i18n.ts`:
   - titleKey + descKey for catalogue listing
   - UI strings for game board labels

4. **Register in PartyRoom** `app/party/[inviteCode]/PartyRoom.tsx`:
   - Add to game catalogue array
   - Add import + render condition

5. **Verify**:
   - `npm test` — 29 tests must pass
   - `npm run lint` — 0 errors
   - `npm run build` — 0 errors, 53+ routes
   - `npm run rag:build` — update RAG index
