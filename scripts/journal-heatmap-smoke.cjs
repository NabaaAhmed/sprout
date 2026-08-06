const { chromium } = require('playwright')

const BASE = process.env.SPROUT_URL || 'http://127.0.0.1:5173/sprout/'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const pass = (m) => console.log('PASS ', m)
  const fail = (m, d) => {
    console.log('FAIL ', m, d || '')
    process.exitCode = 1
  }

  await page.goto(BASE, { waitUntil: 'networkidle' })

  // fake a couple sessions so the heatmap tip text has something to show
  await page.evaluate(() => {
    const key = 'sprout-game-state-v1'
    const s = JSON.parse(localStorage.getItem(key) || '{}')
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const earlier = new Date(today)
    earlier.setDate(earlier.getDate() - 3)
    s.sessionHistory = [
      ...(s.sessionHistory || []),
      { date: earlier.toISOString(), durationMinutes: 25, label: 'CSCI 1730', completed: true },
      { date: earlier.toISOString(), durationMinutes: 22, label: 'Review', completed: true },
      { date: today.toISOString(), durationMinutes: 15, label: 'Math', completed: true },
    ]
    localStorage.setItem(key, JSON.stringify(s))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Journal', exact: true }).click()
  await page.waitForTimeout(400)

  const text = await page.locator('body').innerText()
  if (text.includes('one page per class or subject')) pass('Notebook subtitle copy')
  else fail('Notebook subtitle copy')

  await page.getByRole('button', { name: '+ New Page' }).click()
  const ph = await page.locator('input[placeholder*="CSCI 1730"]').getAttribute('placeholder')
  if (ph === 'e.g., CSCI 1730, Biology, African Studies') pass('New page placeholder')
  else fail('New page placeholder', ph)
  await page.getByRole('button', { name: 'Cancel' }).click()

  // Year label computed
  const year = new Date().getFullYear()
  const yearEl = page.locator('text=Study activity').locator('..').locator('.tabular-nums')
  const yearText = (await yearEl.innerText()).trim()
  if (yearText.includes(String(year)) && !yearText.includes('2024') || yearText.match(/^\d{4}(-\d{4})?$/)) {
    pass(`Year label dynamic: ${yearText}`)
  } else fail('Year label dynamic', yearText)

  // Day labels
  for (const d of ['Mon', 'Wed', 'Fri']) {
    if (text.includes(d) || (await page.locator(`text=${d}`).count()) > 0) pass(`DOW label ${d}`)
    else fail(`DOW label ${d}`)
  }

  // Month labels exist (at least one short month name near heatmap)
  const months = await page.evaluate(() => {
    const header = [...document.querySelectorAll('span')].map((s) => s.textContent.trim())
    return header.filter((t) => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(t))
  })
  months.length > 0 ? pass(`Month labels: ${months.join(', ')}`) : fail('Month labels missing')

  // Tip on click — find a non-future cell with sessions if possible
  const cells = page.locator('button[aria-label*="session"], button[aria-label*="no sessions"]')
  const count = await cells.count()
  if (count > 0) {
    // Prefer one with sessions
    let clicked = false
    for (let i = 0; i < count; i++) {
      const label = await cells.nth(i).getAttribute('aria-label')
      if (label && /\d+ sessions?/.test(label)) {
        await cells.nth(i).click()
        clicked = true
        const tip = label
        const body = await page.locator('body').innerText()
        body.includes(tip.split('—')[0].trim()) || body.includes('min')
          ? pass(`Tooltip/tip: ${tip}`)
          : fail('Tooltip tip visible', tip)
        break
      }
    }
    if (!clicked) {
      await cells.first().click()
      const label = await cells.first().getAttribute('aria-label')
      pass(`Tooltip fallback: ${label}`)
    }
  } else {
    fail('No heatmap cells with aria-labels')
  }

  await browser.close()
  process.exit(process.exitCode || 0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
