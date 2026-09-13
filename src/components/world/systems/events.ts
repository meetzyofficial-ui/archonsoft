/**
 * What happens in the world, as events.
 *
 * A small bus the world's systems announce themselves on — a teleport, a
 * landing, a conversation begun, a comet, fire lit — so that sound, when it
 * comes, has something to listen to without any system knowing about it.
 * Nothing subscribes yet; the hooks are the architecture.
 */
export type WorldEvent =
  | "teleport:out"
  | "teleport:in"
  | "jump"
  | "land"
  | "npc:talk"
  | "npc:thanks"
  | "lead:sent"
  | "comet"
  | "fire:lit"
  | "office:enter";

type Listener = (name: WorldEvent, detail?: Record<string, unknown>) => void;
const listeners = new Set<Listener>();

export const worldEvents = {
  on(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  emit(name: WorldEvent, detail?: Record<string, unknown>) {
    listeners.forEach((listener) => listener(name, detail));
  },
};
