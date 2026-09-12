/**
 * Into Archon World, the way a visitor goes: wait for the opening sweep to
 * offer the language question, pick a language, and enter. Returns once the
 * explorer's camera has taken over.
 */
export async function enterWorld(page, lang = "tr", settle = 6000) {
  const enter = page.locator("[data-enter]");
  await enter.waitFor({ state: "visible", timeout: 45000 });
  /* The question fades in; give the transition a beat before clicking. */
  await page.waitForTimeout(1300);
  if (lang) await page.locator(`.world-overlay [data-lang="${lang}"]`).first().click();
  await page.waitForTimeout(200);
  await enter.click();
  await page.waitForTimeout(settle);
}
