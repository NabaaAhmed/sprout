const { chromium } = require('playwright')

const BASE = process.env.SPROUT_URL || 'http://127.0.0.1:5173/sprout/'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const log = (ok, msg) => console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`)

  await page.goto(BASE, { waitUntil: 'networkidle' })
  // wipe journal pages so we actually hit the default starter set
  await page.evaluate(() => {
    const key = 'sprout-game-state-v1'
    const s = JSON.parse(localStorage.getItem(key) || '{}')
    delete s.journalPages
    delete s.journalNotes
    localStorage.setItem(key, JSON.stringify(s))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.waitForTimeout(300)

  const body = () => page.locator('body').innerText()
  let t = await body()
  const defaults = ['English', 'Math', 'Research', 'Biology', 'Random thoughts']
  const hasDefaults = defaults.every((d) => t.includes(d))
  log(hasDefaults, 'Default starter pages present')

  // open English and type something
  await page.getByRole('button', { name: /English/i }).first().click()
  await page.waitForTimeout(200)
  await page.locator('textarea').fill('Thesis draft paragraph one.')
  await page.waitForTimeout(200)
  await page.getByRole('button', { name: 'Back to pages' }).click()
  await page.waitForTimeout(200)
  t = await body()
  log(t.includes('Thesis draft'), 'List shows content preview after edit')

  // make a new page
  await page.getByRole('button', { name: '+ New Page' }).click()
  await page.locator('input[placeholder*="History"]').fill('Chemistry')
  await page.getByRole('button', { name: 'Create' }).click()
  await page.waitForTimeout(200)
  await page.locator('textarea').fill('Mole ratios and balancing.')
  await page.getByRole('button', { name: 'Back to pages' }).click()
  await page.waitForTimeout(200)
  t = await body()
  log(t.includes('Chemistry') && t.includes('Mole ratios'), 'Create + edit new page')

  // Rename Chemistry
  await page.getByRole('button', { name: /Chemistry/i }).first().click()
  await page.getByRole('button', { name: 'Rename page' }).click()
  await page.locator('input').first().fill('Chem 101')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(150)
  t = await body()
  log(t.includes('Chem 101'), 'Rename page')
  await page.getByRole('button', { name: 'Back to pages' }).click()

  // Delete Math with confirm
  await page.getByRole('button', { name: /Math/i }).first().click()
  await page.getByRole('button', { name: 'Delete page' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.waitForTimeout(200)
  t = await body()
  log(!t.match(/^Math$/m) && !t.includes('Math\n'), 'Delete page (removed from list)')
  // more reliable:
  const titles = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('sprout-game-state-v1')).journalPages.map((p) => p.title)
    } catch {
      return []
    }
  })
  log(!titles.includes('Math') && titles.includes('Chem 101') && titles.includes('English'), 'Delete reflected in storage')

  // Persist across refresh
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => {
    const pages = JSON.parse(localStorage.getItem('sprout-game-state-v1')).journalPages
    const eng = pages.find((p) => p.title === 'English')
    const chem = pages.find((p) => p.title === 'Chem 101')
    return {
      titles: pages.map((p) => p.title),
      eng: eng?.content,
      chem: chem?.content,
      noMath: !pages.some((p) => p.title === 'Math'),
    }
  })
  log(
    after.eng?.includes('Thesis draft') && after.chem?.includes('Mole ratios') && after.noMath,
    'Persist across refresh'
  )
  console.log('Titles after refresh:', after.titles.join(', '))

  await browser.close()
  process.exit(0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
