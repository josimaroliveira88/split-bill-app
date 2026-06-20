# Split Bill App — Agent Guide

## Stack
- Expo 54 / React Native 0.81 / TypeScript (strict)
- React Navigation (bottom tabs + native stacks)
- SQLite (`expo-sqlite`) for persistence (migrated from AsyncStorage)
- React Context (`BillContext`) for bill state
- Brazilian locale — currency format uses comma decimal: `R$ 12,50`

## Commands
```
npm start          # Expo dev server
npm run android    # Dev server + Android
npm run ios        # Dev server + iOS
npm run web        # Dev server + web
```
No lint, typecheck, test, or format scripts exist. Type-check manually via `npx tsc --noEmit`.

## Architecture
- `index.ts` → `App.tsx` (navigation shell) → `src/`
- `src/context/BillContext.tsx` — central state (bill draft, history editing)
- `src/services/calculation.service.ts` — pure split logic
- `src/services/storage.service.ts` — SQLite key-value + history table, 20-entry cap
- `src/theme/colors.ts` — custom dark palette
- `src/utils/formatters.ts` — `formatCurrency("R$ 12,50")` / `parseCurrency`
- Navigation: `RootStack (MainTabs | SavedBillDetail | Backup)` → `Tab (HomeTab | SimpleTab | DetailedTab)`

## Key conventions
- `BillHistoryEntry` stores `bill` (payload) + `result` (computed totals) alongside metadata
- `ItemConsumption` links `itemId` + `personId` with `quantity`; distribute-equal creates one entry per selected person
- Simple split: flat `totalAmount / nPeople + serviceFee`
- Detailed split: service fee mode can be `'equal'` or `'proportional'`
- History editing: `currentEntryMeta` carries the source entry; tabs clear state on press via `tabPress` listener
- Draft auto-saves to SQLite when people/items change

## EAS Build
```json
eas build --platform android --profile production
eas build --platform android --profile preview
eas submit --platform android --profile production
```
`app.json` versionCode `2`, `expo.extra.eas.projectId` set.
