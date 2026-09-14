import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/**
 * WCAG 2A/2AA sweep across every real screen in the app, in a real
 * browser — jsdom (the Vitest unit suite) cannot compute painted colors,
 * so it cannot catch a color-contrast failure. Two such failures were
 * found this way during M1 (a Badge tone and the text-faint token) and
 * are why this suite exists as a permanent regression check rather than
 * a one-off manual script.
 */
async function scanAxe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

async function dismissWelcome(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Commencer' }).click()
}

async function fillRaceGoalStep(page: Page) {
  await page.locator('input[value=sprint]').click()
  const raceDate = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000)
  await page.fill('input[type=date]', raceDate.toISOString().slice(0, 10))
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function fillExperienceStep(page: Page) {
  for (const radio of await page.getByRole('radio', { name: 'Intermédiaire' }).all()) await radio.click()
  await page.getByRole('radio', { name: /déjà fait quelques courses/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function fillAvailabilityStep(page: Page) {
  for (const day of ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']) {
    await page.getByRole('checkbox', { name: new RegExp(`^${day}$`) }).click()
    await page.getByLabel(`Minutes disponibles le ${day}`).fill('90')
  }
  // Pool access every day — not just one specific weekday — so a swap to
  // "Natation" is viable regardless of which real calendar day "today"
  // happens to be when this suite actually runs.
  for (const checkbox of await page.getByRole('checkbox', { name: 'Piscine accessible ce jour-là' }).all()) {
    await checkbox.click()
  }
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function completeOnboarding(page: Page) {
  await dismissWelcome(page)
  await fillRaceGoalStep(page)
  await fillExperienceStep(page)
  await page.getByRole('button', { name: 'Continuer' }).click() // equipment (no required fields)
  await page.getByRole('button', { name: 'Continuer' }).click() // metrics (optional)
  await fillAvailabilityStep(page)
  await page.getByRole('button', { name: 'Créer mon programme' }).click()
  await page.waitForSelector('nav[aria-label="Navigation principale"]')
}

/** Same as completeOnboarding, but declares FTP + sex + weight at the
 * metrics step — the combination that unlocks the Profile page's
 * power-to-weight card and the Nutrition page's weight-calculated ranges. */
async function completeOnboardingWithBiometrics(page: Page) {
  await dismissWelcome(page)
  await fillRaceGoalStep(page)
  await fillExperienceStep(page)
  await page.getByRole('button', { name: 'Continuer' }).click() // equipment
  await page.getByLabel('FTP vélo (watts)').fill('250')
  await page.getByRole('radio', { name: 'Femme' }).click()
  await page.getByLabel('Poids (kg)').fill('62')
  await page.getByLabel('Taille (cm)').fill('168')
  await page.getByRole('button', { name: 'Continuer' }).click()
  await fillAvailabilityStep(page)
  await page.getByRole('button', { name: 'Créer mon programme' }).click()
  await page.waitForSelector('nav[aria-label="Navigation principale"]')
}

test.describe('onboarding', () => {
  test('welcome screen', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('text=Construisons ton programme')
    await scanAxe(page)
  })

  test('race goal step', async ({ page }) => {
    await dismissWelcome(page)
    await page.waitForSelector('text=Ton objectif')
    await scanAxe(page)
  })

  test('experience step', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await page.waitForSelector('text=Ton expérience')
    await scanAxe(page)
  })

  test('equipment step', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await fillExperienceStep(page)
    await page.waitForSelector('text=Ton matériel')
    await scanAxe(page)
  })

  test('metrics step', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await fillExperienceStep(page)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.waitForSelector('text=Tes données connues')
    await scanAxe(page)
  })

  test('metrics step with biometrics filled in', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await fillExperienceStep(page)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.waitForSelector('text=Données personnelles')
    await page.getByRole('radio', { name: 'Femme' }).click()
    await page.getByLabel('Taille (cm)').fill('168')
    await page.getByLabel('Poids (kg)').fill('62')
    await scanAxe(page)
  })

  test('availability step', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await fillExperienceStep(page)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.waitForSelector('text=Ta semaine type')
    await scanAxe(page)
  })

  test('review step', async ({ page }) => {
    await dismissWelcome(page)
    await fillRaceGoalStep(page)
    await fillExperienceStep(page)
    await page.getByRole('button', { name: 'Continuer' }).click()
    await page.getByRole('button', { name: 'Continuer' }).click()
    await fillAvailabilityStep(page)
    await page.waitForSelector('text=Vérifie ton profil')
    await scanAxe(page)
  })
})

test.describe('today', () => {
  test('initial state', async ({ page }) => {
    await completeOnboarding(page)
    await scanAxe(page)
  })

  test('adapted state (readiness check-in)', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('button', { name: 'Fatigué' }).click()
    await page.waitForTimeout(150)
    await scanAxe(page)
  })

  test('swap discipline panel open', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('button', { name: 'Changer de séance' }).click()
    await scanAxe(page)
  })

  test('swapping discipline updates the session immediately', async ({ page }) => {
    await completeOnboarding(page)
    const beforeText = await page.locator('body').innerText()
    await page.getByRole('button', { name: 'Changer de séance' }).click()
    // Pick whichever alternative is offered rather than a fixed discipline
    // name: today's own (pre-swap) discipline shifts with the real
    // calendar date this suite happens to run on, so the target that's
    // actually available (and excluded from the choices) shifts with it.
    await page.getByRole('radio').first().click()
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await page.waitForTimeout(150)
    const afterText = await page.locator('body').innerText()
    expect(afterText).not.toBe(beforeText)
    await scanAxe(page)
  })
})

test.describe('session player', () => {
  test('shows the full checklist, no timer', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Séance effectuée')
    await scanAxe(page)
  })

  test('ticking a block off updates the checklist', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Séance effectuée')
    const firstCheckbox = page.getByRole('checkbox').first()
    await firstCheckbox.click()
    await expect(firstCheckbox).toBeChecked()
    await scanAxe(page)
  })

  test('"Séance effectuée" leads straight to the feedback form', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Séance effectuée')
    await page.getByRole('button', { name: 'Séance effectuée' }).click()
    await page.waitForSelector("text=Comment s'est passée")
    await scanAxe(page)
  })
})

test.describe('missed session', () => {
  test('outcome screen', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: "Je n'ai pas fait cette séance" }).click()
    await page.waitForSelector('text=Pourquoi ?')
    await scanAxe(page) // the form itself
    await page.getByRole('radio', { name: 'Manque de temps' }).click()
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await page.waitForSelector('text=Programme mis à jour')
    await scanAxe(page)
  })
})

test.describe('plan', () => {
  test('collapsed weeks', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Programme' }).click()
    await page.waitForSelector('text=Ton programme')
    await scanAxe(page)
  })

  test('a non-current week expanded', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Programme' }).click()
    await page.waitForSelector('text=Ton programme')
    await page.getByRole('button', { expanded: false }).first().click()
    await scanAxe(page)
  })

  test('shows a visible rest day in the current (expanded) week', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Programme' }).click()
    await page.waitForSelector('text=Ton programme')
    await expect(page.getByText('Repos').first()).toBeVisible()
    await scanAxe(page)
  })

  test('clicking a day opens its detail preview', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Programme' }).click()
    await page.waitForSelector('text=Ton programme')
    await page.locator('a[href^="/day/"]').first().click()
    await page.waitForURL(/\/day\//)
    await scanAxe(page)
  })
})

test.describe('progress', () => {
  test('empty history', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Progrès' }).click()
    await page.waitForSelector('text=Ton progrès')
    await scanAxe(page)
  })

  test('with completed sessions and adaptation history', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('button', { name: 'Fatigué' }).click()
    await page.waitForTimeout(150)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Séance effectuée')
    await page.getByRole('button', { name: 'Séance effectuée' }).click()
    await page.waitForSelector("text=Comment s'est passée")
    await page.getByRole('button', { name: '6', exact: true }).click()
    await page.getByRole('radio', { name: 'Comme prévu' }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('nav[aria-label="Navigation principale"]')

    await page.getByRole('link', { name: 'Progrès' }).click()
    await page.waitForSelector('text=Volume hebdomadaire')
    await scanAxe(page)
  })
})

test.describe('nutrition', () => {
  test('shows session-tied guidance and race-day strategy', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Stratégie jour de course')
    await scanAxe(page)
  })

  test('mentions weight-calculated guidance once a body weight is declared', async ({ page }) => {
    await completeOnboardingWithBiometrics(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Stratégie jour de course')
    const text = await page.locator('body').innerText()
    expect(text).toMatch(/calculés à partir de ton poids/)
    await scanAxe(page)
  })
})

test.describe('profile', () => {
  test('summary', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await scanAxe(page)
  })

  test('zone detail expanded', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await page.getByRole('button', { name: 'Voir le détail des zones' }).click()
    await scanAxe(page)
  })

  test('shows the power-to-weight card once FTP and weight are both known', async ({ page }) => {
    await completeOnboardingWithBiometrics(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await page.waitForSelector('text=Puissance relative')
    const text = await page.locator('body').innerText()
    expect(text).toMatch(/W\/kg/)
    expect(text).toMatch(/Confirmé|Avancé|Intermédiaire|Occasionnel|Débutant|Élite/)
    await scanAxe(page)
  })
})

test.describe('calibration tests', () => {
  test('FTP test form and result', async ({ page }) => {
    await completeOnboarding(page)
    await page.goto('/profile/tests/ftp')
    await page.waitForSelector('text=Test FTP')
    await scanAxe(page)
    await page.getByLabel(/Puissance moyenne/).fill('220')
    await page.getByRole('button', { name: 'Calculer ma FTP' }).click()
    await page.waitForSelector('text=FTP mise à jour')
    await scanAxe(page)
  })
})

test.describe('not found', () => {
  test('unknown route', async ({ page }) => {
    await completeOnboarding(page)
    await page.goto('/this-route-does-not-exist')
    await page.waitForSelector('text=Introuvable')
    await scanAxe(page)
  })
})
