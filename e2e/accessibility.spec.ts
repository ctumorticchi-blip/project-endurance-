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
})

test.describe('session player', () => {
  test('first step', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Suivant :')
    await scanAxe(page)
  })

  test('paused step', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    await page.waitForSelector('text=Suivant :')
    await page.getByRole('button', { name: 'Pause' }).click()
    await scanAxe(page)
  })

  test('finished screen', async ({ page }) => {
    await completeOnboarding(page)
    await page.getByRole('link', { name: 'Commencer' }).click()
    let guard = 0
    while (guard < 60) {
      guard++
      if ((await page.locator('body').innerText()).includes('Séance terminée')) break
      await page.getByRole('button', { name: 'Passer' }).click()
      await page.waitForTimeout(50)
    }
    await page.waitForSelector('text=Séance terminée')
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
    let guard = 0
    while (guard < 60) {
      guard++
      if ((await page.locator('body').innerText()).includes('Séance terminée')) break
      await page.getByRole('button', { name: 'Passer' }).click()
      await page.waitForTimeout(50)
    }
    await page.getByRole('button', { name: 'Continuer' }).click()
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
