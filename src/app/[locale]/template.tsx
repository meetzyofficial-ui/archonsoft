/**
 * Route transition. `template.tsx` remounts on every navigation, so one CSS
 * animation gives every route a consistent entrance without an animation
 * library or an exit-animation workaround. Kept short: a page transition the
 * visitor has to wait through is a tax, not a flourish.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
