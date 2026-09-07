# UI And Card Text

## React's role

React components read state, render HTML/CSS, and dispatch store actions. They should not become alternate rule engines.

A button should call an action such as `playCard(instanceId)`; it should not independently remove the card, award Divine Light, or tick cooldowns.

## Card rules digest

Many surfaces show cards: hand, board, collection detail, DeckBuilder, pack opening, boss rewards, Infinitude, and tooltips. They all converge on:

- `src/ui/cardStatSummary.ts`
- `getCardSummarySections`
- `getCardPreviewLines`
- `src/ui/components/CardRulesDigest.tsx`

The current summary model has at most four sections:

1. `Effect`
2. `Board`, only when the passive bonus is nonzero
3. `Attacks`, for Seraphim and Angels
4. `Summon`, for Angels, including materials and conditions

Duplicate section titles are removed case-insensitively. This prevents each UI from developing its own increasingly noisy card format.

## Why formatting is separate from execution

The executor needs to mutate/return gameplay state. The digest needs compact readable text. They share effect data but have different responsibilities. Do not put JSX inside an effect handler and do not make a component reimplement effect math just to display a number.

## Card text pipeline

1. Author card data and effects.
2. Registry normalizes runtime data.
3. Summary helpers interpret the definition for display.
4. `CardRulesDigest` renders the sections.
5. Card-facing surfaces reuse the digest.

Descriptions should state mechanics, not strategic advice. Generated or canonical text must remain synchronized with runtime behavior.

## UI state boundaries

A modal can own temporary presentation state such as whether it is open or which tab is selected. Persistent game facts belong in Zustand. A picker can store the current selection locally, but submitting it must call the store's validation action.
