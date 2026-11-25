/**
 * Into Archon World, the way a visitor goes: wait for the opening sweep to
 * offer the language question, pick a language, and enter. Returns once the
 * explorer's camera has taken over.
 */
export async function enterWorld(page, lang = "tr", settle = 6000) {
  /* The world opens by itself once it is built; there is no question to answer. */
  await page.waitForSelector('.world-overlay[data-stage="world"]', { timeout: 45000 });
  await page.waitForTimeout(800);
  if (lang) await page.locator(`.world-overlay [data-lang="${lang}"]`).first().click();
  await page.waitForTimeout(settle);
}
