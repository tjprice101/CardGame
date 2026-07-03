/**
 * Fast deep-clone for plain-data game-state objects.
 *
 * Two execution contexts:
 *
 * 1. **Inside an Immer producer** (`set(s => { ... })`): `s.deck` etc. are
 *    Immer draft Proxies. `structuredClone` cannot clone Proxy objects and
 *    throws a DataCloneError. We detect this with `isDraft` and use Immer's
 *    own `current()` function, which snapshots the draft into a plain frozen
 *    copy — exactly what we need for the savedState snapshot pattern.
 *
 * 2. **Outside a producer** (SaveManager, restore paths): the value is a
 *    plain (possibly frozen) object. We prefer the native `structuredClone`
 *    API (available in Electron/Chromium 98+, Node 17+, and modern browsers)
 *    which is ~3–5× faster than the JSON round-trip because it doesn't
 *    allocate a serialised string. Falls back to JSON for older runtimes.
 */
import { isDraft, current as immerCurrent } from 'immer';

const _nativeClone =
  typeof structuredClone === 'function' ? structuredClone : null;

export function cloneState<T>(value: T): T {
  // Inside an Immer producer: `value` is a draft Proxy.
  // `immerCurrent()` produces a deep frozen plain-object snapshot instantly.
  // This is already a complete independent copy — no further cloning required.
  if (isDraft(value)) {
    return immerCurrent(value) as T;
  }
  // Outside a producer: structuredClone (fast) or JSON round-trip (safe fallback).
  if (_nativeClone) return _nativeClone(value) as T;
  return JSON.parse(JSON.stringify(value)) as T;
}
