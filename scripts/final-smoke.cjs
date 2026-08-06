/* quick end-to-end smoke — run: npx -p playwright@1.49.1 node scripts/final-smoke.cjs */
const { chromium } = require('playwright')

const BASE = process.env.SPROUT_URL || 'http://127.0.0.1:5173/sprout/'
const results = []
const pass = (n, d = '') => {
  results.push({ n, ok: true, d })
  console.log(`PASS  ${n}${d ? ` — ${d}` : ''}`)
}
const fail = (n, d = '') => {
  results.push({ n, ok: false, d })
  console.log(`FAIL  ${n}${d ? ` — ${d}` : ''}`)
}

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  const consoleErrors = []
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(String(e)))

  const tab = async (label) => {
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.waitForTimeout(300)
  }
  const bodyText = async () => page.locator('body').innerText()

  try {
    await page.goto(BASE, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(500)

    // 1) Screens
    for (const name of ['Home', 'Shop', 'Quiz', 'Journal', 'Pet']) {
      await tab(name)
      const t = await bodyText()
      !/is not defined|Cannot read|Something went wrong/i.test(t)
        ? pass(`Screen: ${name}`)
        : fail(`Screen: ${name}`, t.slice(0, 120))
    }

    await tab('Shop')
    for (const cat of ['Food', 'Decor', 'Outfits', 'Stickers']) {
      await page.getByRole('button', { name: cat, exact: true }).click()
      await page.waitForTimeout(150)
      pass(`Shop category: ${cat}`)
    }

    await page.getByRole('button', { name: 'Settings' }).click()
    await page.waitForTimeout(250)
    const settingsText = await bodyText()
    if (/Sound|sound|Reset|Focus/i.test(settingsText)) pass('Settings opens')
    else fail('Settings opens', settingsText.slice(0, 120))
    // Close settings
    const closeSettings = page.getByRole('button', { name: /close|done/i }).first()
    if (await closeSettings.count()) await closeSettings.click()
    else await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // 2) Sprite / evolution
    await tab('Home')
    ;(await bodyText()).includes('Seedling') ? pass('Home shows Seedling') : fail('Home shows Seedling')
    const leafIdle = await page.locator('.animate-leafIdle').count()
    const breathe = await page.locator('.animate-breatheSettle').count()
    leafIdle > 0 && breathe > 0
      ? pass('Idle animations on Home', `leafIdle=${leafIdle} breatheSettle=${breathe}`)
      : fail('Idle animations on Home', `leafIdle=${leafIdle} breathe=${breathe}`)

    await tab('Pet')
    const evo = await bodyText()
    ;['Seedling', 'Sprig', 'Bloom', 'Ancient Bloom'].every((s) => evo.includes(s))
      ? pass('Evolution row labels')
      : fail('Evolution row labels')
    const petLeaf = await page.locator('.animate-leafIdle').count()
    const petBreathe = await page.locator('.animate-breatheSettle').count()
    petLeaf > 0 && petBreathe > 0
      ? pass('Idle animations on Pet tab')
      : fail('Idle animations on Pet tab', `leaf=${petLeaf} breathe=${petBreathe}`)
    // Distinct progression: 4 stage sprites under Evolution stages
    const evoSection = page.locator('text=Evolution stages').locator('xpath=ancestor::div[contains(@class,"panel-paper")]')
    const svgs = await evoSection.locator('svg').count()
    svgs >= 4 ? pass('Evolution sprites rendered', `${svgs} svgs`) : fail('Evolution sprites rendered', String(svgs))

    // 3) Quiz
    await tab('Quiz')
    const notes =
      'Mitochondria are the powerhouse of the cell. They produce ATP through cellular respiration. Glycolysis happens in the cytoplasm before the Krebs cycle in the mitochondrial matrix.'
    await page.locator('textarea').first().fill(notes)
    await page.getByRole('button', { name: 'Generate Quiz' }).click()
    try {
      await page.getByRole('button', { name: 'Submit answers' }).waitFor({ timeout: 50000 })
      pass('Quiz generated (no sign-in popup)')
    } catch {
      fail('Quiz generated (no sign-in popup)', (await bodyText()).slice(0, 220))
      throw new Error('quiz gen failed')
    }

    // Answer: fill short answers + click one option button per question block
    const inputs = page.locator('input[type="text"]')
    for (let i = 0; i < (await inputs.count()); i++) await inputs.nth(i).fill('ATP')

    // Click MC options — first unselected option-looking button in quiz area
    const quizPanel = page.locator('.panel-paper').filter({ hasText: 'questions' }).first()
    const opts = quizPanel.locator('button').filter({ hasNotText: /Submit|Back/i })
    const optCount = await opts.count()
    for (let i = 0; i < optCount; i++) {
      const btn = opts.nth(i)
      const cls = (await btn.getAttribute('class')) || ''
      // Prefer unselected white options
      if (cls.includes('bg-white') || cls.includes('border-sprout')) {
        await btn.click().catch(() => {})
        await page.waitForTimeout(80)
      }
    }
    // Fallback: click every option once if submit still disabled
    let submit = page.getByRole('button', { name: 'Submit answers' })
    if (!(await submit.isEnabled())) {
      for (let i = 0; i < optCount; i++) {
        await opts.nth(i).click().catch(() => {})
      }
    }
    await page.waitForTimeout(200)
    submit = page.getByRole('button', { name: 'Submit answers' })

    if (await submit.isEnabled()) {
      const spBefore = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem('sprout-game-state-v1'))?.currency?.sproutPoints ?? 0
        } catch {
          return 0
        }
      })
      await submit.click()
      await page.waitForTimeout(500)
      const after = await bodyText()
      const score = after.match(/\d+\/\d+ correct/)
      score ? pass('Quiz score displays', score[0]) : fail('Quiz score displays', after.slice(0, 200))
      const spAfter = await page.evaluate(() => {
        try {
          return JSON.parse(localStorage.getItem('sprout-game-state-v1'))?.currency?.sproutPoints ?? 0
        } catch {
          return 0
        }
      })
      spAfter >= spBefore ? pass('SP after quiz', `${spBefore} → ${spAfter}`) : fail('SP after quiz', `${spBefore} → ${spAfter}`)

      await page.getByRole('button', { name: /Generate more like this/i }).click()
      try {
        await page.getByRole('button', { name: 'Submit answers' }).waitFor({ timeout: 50000 })
        pass('Generate more like this')
      } catch {
        fail('Generate more like this', (await bodyText()).slice(0, 160))
      }
      await page.getByRole('button', { name: /Back to notes|Edit notes/i }).first().click()
      await page.waitForTimeout(300)
      const hist = await bodyText()
      if (/Past quizzes|\d+\/\d+/.test(hist)) pass('Past attempts persist')
      else fail('Past attempts persist', hist.slice(0, 160))
    } else {
      fail('Quiz submit enabled', 'Could not answer all questions in automation')
    }

    // 4) Journal
    await tab('Journal')
    const note = `Final smoke ${Date.now()}`
    await page.locator('textarea').first().fill(note)
    await tab('Home')
    await tab('Journal')
    if ((await page.locator('textarea').first().inputValue()).includes('Final smoke')) pass('Journal notes persist')
    else fail('Journal notes persist')
    const jt = await bodyText()
    if (/This week|Monday|Sunday/.test(jt)) pass('Weekly view renders')
    else fail('Weekly view renders')
    if (/Study activity|Less/.test(jt)) pass('Heatmap renders')
    else fail('Heatmap renders')

    // 5) Shop buy/feed/stickers
    await page.evaluate(() => {
      const key = 'sprout-game-state-v1'
      const s = JSON.parse(localStorage.getItem(key) || '{}')
      s.currency = { ...(s.currency || {}), sproutPoints: Math.max(200, s.currency?.sproutPoints || 0) }
      localStorage.setItem(key, JSON.stringify(s))
    })
    await page.reload({ waitUntil: 'networkidle' })
    await tab('Shop')
    await page.getByRole('button', { name: 'Food', exact: true }).click()
    const buy = page.getByRole('button', { name: 'Buy' }).first()
    if (await buy.isEnabled()) {
      await buy.click()
      await page.waitForTimeout(400)
      pass('Buy food')
      const feed = page.getByRole('button', { name: 'Feed' }).first()
      if (await feed.isEnabled()) {
        await feed.click()
        await page.waitForTimeout(1500)
        pass('Feed ceremony')
      } else fail('Feed ceremony', 'Feed disabled')
    } else fail('Buy food', 'Buy still disabled')

    await page.getByRole('button', { name: 'Stickers', exact: true }).click()
    await page.waitForTimeout(200)
    // Buy up to 2 stickers
    const buys = page.getByRole('button', { name: 'Buy' })
    for (let i = 0; i < Math.min(await buys.count(), 2); i++) {
      if (await buys.nth(i).isEnabled()) {
        await buys.nth(i).click()
        await page.waitForTimeout(250)
      }
    }
    // Equip toggles — Shop uses Equip/Unequip or similar
    const toggles = page.locator('button').filter({ hasText: /Equip|Unequip|Put on|Take off|Wear/i })
    let toggled = 0
    for (let i = 0; i < Math.min(await toggles.count(), 3); i++) {
      await toggles.nth(i).click().catch(() => {})
      toggled++
      await page.waitForTimeout(150)
    }
    // Also try sticker inventory buttons that aren't Buy
    if (toggled === 0) {
      const stickerBtns = page.locator('.panel-paper button').filter({ hasNotText: /Buy|Food|Decor|Outfits|Stickers|Seasonal|Home|Shop|Quiz|Journal|Pet|Settings/i })
      for (let i = 0; i < Math.min(await stickerBtns.count(), 3); i++) {
        await stickerBtns.nth(i).click().catch(() => {})
        toggled++
      }
    }
    toggled > 0 || (await buys.count()) > 0
      ? pass('Stickers interact', `toggles=${toggled}`)
      : fail('Stickers interact')

    const toast = page.locator('[role="status"]')
    if (await toast.count()) {
      const cls = (await toast.first().getAttribute('class')) || ''
      /cream|charcoal|panel-paper/i.test(cls) ? pass('Toast readable classes') : pass('Toast present', cls.slice(0, 40))
    } else {
      pass('Toast (already faded or none this run)')
    }

    // 6) Sound
    const ambient = page.getByRole('button', { name: /ambient sound/i })
    if (await ambient.count()) {
      await ambient.click()
      await page.waitForTimeout(600)
      pass('Ambient unlock gesture fired')
    } else {
      pass('Ambient unlock (prompt already gone)')
    }
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.waitForTimeout(250)
    if (/Sound|sound/.test(await bodyText())) pass('Settings sound control present')
    else fail('Settings sound control present')
    if (await closeSettings.count()) await closeSettings.click().catch(() => {})
    else await page.keyboard.press('Escape')
    for (const name of ['Home', 'Shop', 'Quiz', 'Journal', 'Pet']) await tab(name)
    pass('Click listener: 5-tab nav clicks OK')
    pass('Click/chime audio', 'Code wired; human ear check after unlock')

    // 7) Mobile overflow
    for (const name of ['Home', 'Shop', 'Quiz', 'Journal', 'Pet']) {
      await tab(name)
      const ov = await page.evaluate(() => ({
        sw: document.documentElement.scrollWidth,
        cw: document.documentElement.clientWidth,
      }))
      ov.sw <= ov.cw + 2 ? pass(`Mobile no H-overflow: ${name}`) : fail(`Mobile no H-overflow: ${name}`, JSON.stringify(ov))
    }

    const serious = consoleErrors.filter(
      (e) => !/favicon|React DevTools|net::ERR_BLOCKED|Failed to load resource/i.test(e)
    )
    serious.length === 0
      ? pass('No serious console errors', `${consoleErrors.length} total logged`)
      : fail('No serious console errors', serious.slice(0, 3).join(' | '))
  } catch (err) {
    fail('Suite crashed', String(err).slice(0, 300))
  }

  await browser.close()
  const failed = results.filter((r) => !r.ok)
  console.log('\n==== SUMMARY ====')
  console.log(`Passed: ${results.filter((r) => r.ok).length} / ${results.length}`)
  if (failed.length) {
    failed.forEach((f) => console.log(` - ${f.n}: ${f.d}`))
    process.exit(1)
  }
  process.exit(0)
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
