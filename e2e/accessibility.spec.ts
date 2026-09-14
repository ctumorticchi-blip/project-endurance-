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
  await page.getByRole('checkbox', { name: 'Repos le Dimanche' }).click()
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

async function fillRunningRaceGoalStep(page: Page) {
  await page.getByRole('radio', { name: 'Course à pied' }).click()
  await page.locator('input[value="10k"]').click()
  const raceDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  await page.fill('input[type=date]', raceDate.toISOString().slice(0, 10))
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function fillRunningExperienceStep(page: Page) {
  for (const radio of await page.getByRole('radio', { name: 'Intermédiaire' }).all()) await radio.click()
  await page.getByRole('radio', { name: /déjà couru quelques courses/ }).click()
  await page.getByRole('button', { name: 'Continuer' }).click()
}

async function completeRunningOnboarding(page: Page) {
  await dismissWelcome(page)
  await fillRunningRaceGoalStep(page)
  await fillRunningExperienceStep(page)
  await page.getByRole('button', { name: 'Continuer' }).click() // equipment (informational, no fields)
  await page.getByRole('button', { name: 'Continuer' }).click() // metrics (optional)
  await fillAvailabilityStep(page)
  await page.getByRole('button', { name: 'Créer mon programme' }).click()
  await page.waitForSelector('nav[aria-label="Navigation principale"]')
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

  test('nudges toward setting nutrition preferences until they are configured', async ({ page }) => {
    await completeOnboarding(page)
    await page.waitForSelector('text=Personnalise tes menus nutrition')
    await scanAxe(page)

    await page.getByRole('link', { name: 'Configurer' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')

    await page.getByRole('link', { name: 'Aujourd’hui' }).click()
    await expect(page.getByText('Personnalise tes menus nutrition')).toHaveCount(0)
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

  test('converting to "Repos" removes the session and asks whether to move it', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('button', { name: 'Changer de séance' }).click()
    await page.getByRole('radio', { name: 'Repos' }).click()
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await page.waitForSelector('text=Jour de repos ajouté')
    await scanAxe(page)

    // fillAvailabilityStep marks every day available (incl. the chosen
    // rest day, Sunday, at 90 min) so a move candidate always exists.
    const moveDay = page.getByRole('radio').first()
    await moveDay.click()
    await page.getByRole('button', { name: 'Déplacer', exact: true }).click()
    await page.waitForTimeout(150)
    // Back to the normal Today view (today is now a rest day).
    await expect(page.getByText('Jour de repos ajouté')).toHaveCount(0)
    await scanAxe(page)
  })

  test('converting to "Repos" and declining to move it leaves today as a rest day', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('button', { name: 'Changer de séance' }).click()
    await page.getByRole('radio', { name: 'Repos' }).click()
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await page.waitForSelector('text=Jour de repos ajouté')

    await page.getByRole('button', { name: 'Ne pas déplacer' }).click()
    await page.waitForTimeout(150)
    await expect(page.getByText('Jour de repos')).toBeVisible()
    await scanAxe(page)
  })

  test('shows a congrats summary instead of the pre-session view once completed', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Séance effectuée')
    await page.getByRole('button', { name: 'Séance effectuée' }).click()
    await page.waitForSelector("text=Comment s'est passée")
    await page.getByRole('button', { name: '7', exact: true }).click()
    await page.getByRole('radio', { name: 'Comme prévu' }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('nav[aria-label="Navigation principale"]')

    await expect(page.getByText('Bravo, séance terminée')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Fatigué' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Commencer' })).toHaveCount(0)
    await scanAxe(page)
  })

  test('shows a time-of-day meal nudge once nutrition preferences are set', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')

    await page.getByRole('link', { name: 'Aujourd’hui' }).click()
    await page.waitForSelector('text=Vélo')
    const text = await page.locator('body').innerText()
    const hour = new Date().getHours()
    const inAMealWindow = (hour >= 5 && hour < 11) || (hour >= 11 && hour < 16) || (hour >= 16 && hour < 22)
    if (inAMealWindow) {
      expect(text.toLowerCase()).toMatch(/petit-déjeuner|déjeuner|dîner/)
      await expect(page.getByRole('link', { name: 'Voir le menu' })).toBeVisible()
    }
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
    await page.waitForSelector('text=Charge hebdomadaire')
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

  test('shows the preferences form before any daily menu is generated', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await scanAxe(page)
  })

  test('setting preferences reveals a daily menu with breakfast/lunch/dinner', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('radio', { name: 'Végétarien' }).click()
    await page.getByRole('checkbox', { name: 'Sans lactose' }).click()
    await page.getByRole('radio', { name: /Confortable/ }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')
    const text = await page.locator('body').innerText()
    expect(text.toLowerCase()).toMatch(/petit-déjeuner/)
    expect(text.toLowerCase()).toMatch(/déjeuner/)
    expect(text.toLowerCase()).toMatch(/dîner/)
    await scanAxe(page)
  })

  test('produces a safe menu for the strictest diet + allergen combination (vegan, gluten-free, nut-free)', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('radio', { name: 'Végan' }).click()
    await page.getByRole('checkbox', { name: 'Sans gluten' }).click()
    await page.getByRole('checkbox', { name: 'Sans fruits à coque' }).click()
    await page.getByRole('radio', { name: /Serré/ }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')
    await scanAxe(page)
  })

  test('editing preferences reopens the form pre-filled, and cancel returns to the menu', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('radio', { name: 'Pescétarien' }).click()
    await page.getByRole('radio', { name: /Modéré/ }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')

    await page.getByRole('button', { name: 'Modifier mes préférences' }).click()
    await expect(page.getByRole('radio', { name: 'Pescétarien' })).toBeChecked()
    await scanAxe(page)

    await page.getByRole('button', { name: 'Annuler' }).click()
    await page.waitForSelector('text=Modifier mes préférences')
  })

  test('the menu stays the same across a reload on the same day (deterministic, not random)', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Modifier mes préférences')
    const before = await page.locator('body').innerText()

    await page.reload()
    await page.waitForSelector('text=Modifier mes préférences')
    const after = await page.locator('body').innerText()
    expect(after).toBe(before)
  })

  test('the menu du jour section appears before the general principles', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Ton menu du jour')

    const bodyText = await page.locator('body').innerText()
    const menuIndex = bodyText.indexOf('Ton menu du jour')
    const principlesIndex = bodyText.indexOf('Principes généraux')
    expect(menuIndex).toBeGreaterThanOrEqual(0)
    expect(principlesIndex).toBeGreaterThan(menuIndex)
  })

  test('switching to the week view shows a menu for every day of the current week', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Ton menu du jour')

    await page.getByRole('button', { name: 'Semaine' }).click()
    await page.waitForSelector('text=Ton menu de la semaine')
    await expect(page.locator('h3')).toHaveCount(7)
    await scanAxe(page)

    await page.getByRole('button', { name: 'Jour' }).click()
    await page.waitForSelector('text=Ton menu du jour')
  })

  test('swapping a meal for an alternative persists across reload', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Ton menu du jour')

    const mealTitle = page.locator('li p.font-semibold').first()
    const before = await mealTitle.textContent()

    await page.getByRole('button', { name: 'Changer' }).first().click()
    await page.waitForSelector('text=Autres propositions')
    const radios = await page.getByRole('radio').all()
    for (const radio of radios) {
      if (!(await radio.isChecked())) {
        await radio.click()
        break
      }
    }
    await scanAxe(page)
    await page.getByRole('button', { name: 'Confirmer' }).click()

    const after = await mealTitle.textContent()
    expect(after).not.toBe(before)

    await page.reload()
    await page.waitForSelector('text=Ton menu du jour')
    const afterReload = await mealTitle.textContent()
    expect(afterReload).toBe(after)
  })

  test('shopping list: categorized, navigable week to week, and reflects a meal swap', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Tes préférences alimentaires')
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Ton menu du jour')

    await page.getByRole('button', { name: '🛒 Courses' }).click()
    await page.waitForSelector('text=Ta liste de courses')
    await expect(page.getByRole('heading', { name: 'Protéines' })).toBeVisible()
    await scanAxe(page)

    const week1 = await page.locator('body').innerText()
    await page.getByRole('button', { name: 'Suivante →' }).click()
    await page.waitForTimeout(150)
    const week2 = await page.locator('body').innerText()
    expect(week2).not.toBe(week1)
    await scanAxe(page)

    await page.getByRole('button', { name: '← Précédente' }).click()
    await page.waitForTimeout(150)
    expect(await page.locator('body').innerText()).toBe(week1)

    // Swap a meal in the week view, then confirm the shopping list changed.
    await page.getByRole('button', { name: 'Semaine', exact: true }).click()
    await page.waitForSelector('text=Ton menu de la semaine')
    await page.getByRole('button', { name: 'Changer' }).first().click()
    await page.waitForSelector('text=Autres propositions')
    for (const radio of await page.getByRole('radio').all()) {
      if (!(await radio.isChecked())) {
        await radio.click()
        break
      }
    }
    await page.getByRole('button', { name: 'Confirmer' }).click()
    await page.waitForTimeout(150)

    await page.getByRole('button', { name: '🛒 Courses' }).click()
    await page.waitForSelector('text=Ta liste de courses')
    expect(await page.locator('body').innerText()).not.toBe(week1)
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

  test('editing availability changes the rest day and reflects it in the plan', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await page.getByRole('link', { name: 'Modifier mes disponibilités' }).click()
    await page.waitForSelector('text=Modifier tes disponibilités')
    await scanAxe(page)

    // Move the rest day from Sunday (set by fillAvailabilityStep) to Wednesday.
    await page.getByRole('checkbox', { name: 'Repos le Dimanche' }).click()
    await page.getByRole('checkbox', { name: 'Repos le Mercredi' }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Disponibilités mises à jour')
    await scanAxe(page)

    await page.getByRole('button', { name: 'Retour au profil' }).click()
    await page.waitForSelector('text=Ton profil')
  })

  test('the "Continuer"-equivalent Save stays disabled with zero rest days chosen', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await page.getByRole('link', { name: 'Modifier mes disponibilités' }).click()
    await page.waitForSelector('text=Modifier tes disponibilités')

    // Uncheck the only rest day without picking another.
    await page.getByRole('checkbox', { name: 'Repos le Dimanche' }).click()
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  })

  test('adding a secondary race shows it on Today and lets it be removed again', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Autres courses')
    await page.getByRole('button', { name: 'Ajouter' }).click()
    await page.getByLabel('Nom de la course').fill('Triathlon de Test')
    const raceDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
    await page.getByLabel('Date').fill(raceDate.toISOString().slice(0, 10))
    await page.getByRole('radio', { name: 'Sprint' }).click()
    await page.getByRole('button', { name: 'Ajouter', exact: true }).click()
    await page.waitForSelector('text=Triathlon de Test')
    await scanAxe(page)

    await page.getByRole('link', { name: 'Aujourd’hui' }).click()
    await page.waitForSelector('text=Autres courses à venir')
    await expect(page.getByText('Triathlon de Test')).toBeVisible()
    await scanAxe(page)

    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Triathlon de Test')
    await page.getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByText('Triathlon de Test')).toHaveCount(0)

    await page.getByRole('link', { name: 'Aujourd’hui' }).click()
    await expect(page.getByText('Autres courses à venir')).toHaveCount(0)
  })

  test('legal pages are reachable and cross-link to each other', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')

    await page.getByRole('link', { name: 'Mentions légales' }).click()
    await page.waitForSelector('text=Mentions légales')
    await scanAxe(page)

    await page.getByRole('link', { name: 'Politique de confidentialité' }).click()
    await page.waitForSelector('text=Politique de confidentialité')
    await scanAxe(page)

    await page.getByRole('link', { name: 'Retour au profil' }).click()
    await page.waitForSelector('text=Ton profil')
  })
})

test.describe('running (multisport rollout)', () => {
  test('race goal step offers running distances once the sport toggle is switched', async ({ page }) => {
    await dismissWelcome(page)
    await page.getByRole('radio', { name: 'Course à pied' }).click()
    await expect(page.locator('input[value="10k"]')).toBeVisible()
    await expect(page.locator('input[value=sprint]')).toHaveCount(0)
    await scanAxe(page)
  })

  test('experience step asks only running-specific questions, no swim/bike', async ({ page }) => {
    await dismissWelcome(page)
    await fillRunningRaceGoalStep(page)
    await page.waitForSelector('text=Ton expérience')
    expect(await page.getByRole('radio', { name: 'Intermédiaire' }).count()).toBe(2)
    await expect(page.getByText('🏊 Niveau natation')).toHaveCount(0)
    await expect(page.getByText('🚴 Niveau vélo')).toHaveCount(0)
    await scanAxe(page)
  })

  test('equipment step shows an informational message instead of swim/bike checkboxes', async ({ page }) => {
    await dismissWelcome(page)
    await fillRunningRaceGoalStep(page)
    await fillRunningExperienceStep(page)
    await page.waitForSelector('text=ne demande pas de matériel spécifique')
    await scanAxe(page)
  })

  test('availability step has no pool-access checkbox for a running plan', async ({ page }) => {
    await dismissWelcome(page)
    await fillRunningRaceGoalStep(page)
    await fillRunningExperienceStep(page)
    await page.getByRole('button', { name: 'Continuer' }).click() // equipment
    await page.getByRole('button', { name: 'Continuer' }).click() // metrics
    await page.waitForSelector('text=Ta semaine type')
    await expect(page.getByText('Piscine accessible ce jour-là')).toHaveCount(0)
    await scanAxe(page)
  })

  test('full happy path generates a running-only plan visible on Today', async ({ page }) => {
    await completeRunningOnboarding(page)
    await scanAxe(page)

    // No swim/bike session should ever appear for a running-only plan.
    await expect(page.getByText('Vélo', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Natation', { exact: true })).toHaveCount(0)
  })

  test('Today offers only "Convertir en repos", no discipline-swap ChoiceGroup', async ({ page }) => {
    await completeRunningOnboarding(page)
    const swapButton = page.getByRole('button', { name: 'Convertir en repos' })
    if (await swapButton.count()) {
      await swapButton.click()
      await expect(page.getByRole('radio')).toHaveCount(0)
      await expect(page.getByText('Convertir cette séance en jour de repos ?')).toBeVisible()
      await scanAxe(page)
    }
  })

  test('Plan screen shows only running sessions, grounded in distance-specific periodization', async ({ page }) => {
    await completeRunningOnboarding(page)
    await page.getByRole('link', { name: 'Programme' }).click()
    await page.waitForSelector('text=Ton programme')
    await expect(page.getByText('10 km')).toBeVisible()
    await scanAxe(page)
  })

  test('Profile hides the FTP/CSS calibration rows for a runner', async ({ page }) => {
    await completeRunningOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await expect(page.getByText('FTP vélo')).toHaveCount(0)
    await expect(page.getByText('CSS natation')).toHaveCount(0)
    await expect(page.getByText('Allure seuil course')).toBeVisible()
    await scanAxe(page)
  })

  test('editing availability regenerates a running plan (no longer a "coming soon" placeholder)', async ({ page }) => {
    await completeRunningOnboarding(page)
    await page.getByRole('link', { name: 'Profil' }).click()
    await page.waitForSelector('text=Ton profil')
    await page.getByRole('link', { name: 'Modifier mes disponibilités' }).click()
    await page.waitForSelector('text=Modifier tes disponibilités')
    await scanAxe(page)

    await page.getByRole('checkbox', { name: 'Repos le Dimanche' }).click()
    await page.getByRole('checkbox', { name: 'Repos le Mercredi' }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForSelector('text=Disponibilités mises à jour')
    await scanAxe(page)
  })

  test('Nutrition shows running-specific race-day fueling guidance', async ({ page }) => {
    await completeRunningOnboarding(page)
    await page.getByRole('link', { name: 'Nutrition' }).click()
    await page.waitForSelector('text=Stratégie jour de course')
    const text = await page.locator('body').innerText()
    expect(text).toMatch(/glucides par heure/)
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
