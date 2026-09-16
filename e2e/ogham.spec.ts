import { expect, test, type Locator, type Page } from '@playwright/test';

import data from '../src/data/ogham-reference.json';

async function configureLockedSession(page: Page) {
    await page.goto('/simulators/ogham');
    const panel = page.getByRole('region', { name: '오검 효과 재설정', exact: true });
    const next = panel.getByRole('region', { name: '다음 재설정 비용' });
    const totals = panel.getByRole('region', { name: '누적 소모량' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('마비노기 오검 효과 재설정 시뮬레이터');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://erinn.me/simulators/ogham');
    await panel.getByRole('button', { name: '현재 효과 직접 설정' }).click();
    await panel.getByRole('combobox', { name: '1번 효과', exact: true }).selectOption('10015');
    await panel.getByRole('combobox', { name: '1번 레벨', exact: true }).selectOption('3');
    await panel.getByRole('combobox', { name: '2번 효과', exact: true }).selectOption('10086');
    await panel.getByRole('combobox', { name: '2번 레벨', exact: true }).selectOption('10');
    await panel.getByRole('combobox', { name: '3번 레벨', exact: true }).selectOption('7');
    await expect(totals).toContainText('재설정 0회');
    await expect(totals).toContainText('0 Gold');
    const lock = panel.getByRole('button', { name: '3번 효과 잠금' });
    await lock.focus();
    await page.keyboard.press('Space');
    await expect(lock).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByRole('combobox', { name: '3번 레벨', exact: true })).toBeDisabled();
    await expect(next).toContainText('10,000 Gold');
    await expect(next).toContainText('오검 파편 × 3');
    await expect(next).toContainText('불타래 × 1');
    await panel.getByRole('button', { name: '설정 닫기' }).click();
    return { panel, totals, lock };
}

async function assertResetAccounting(panel: Locator, totals: Locator, lock: Locator, lockedText: string) {
    const reset = panel.getByRole('button', { name: '재설정', exact: true });
    await reset.click();
    await reset.click();
    await expect(totals).toContainText('재설정 2회');
    await expect(totals).toContainText('20,000 Gold');
    await expect(totals).toContainText('오검 파편 × 6');
    await expect(totals).toContainText('불타래 × 2');
    expect(await lock.locator('..').innerText()).toBe(lockedText);
    await panel.getByRole('button', { name: '1번 효과 잠금' }).click();
    await expect(panel.getByRole('button', { name: '2번 효과 잠금' })).toBeDisabled();
    await reset.click();
    await expect(totals).toContainText('재설정 3회');
    await expect(totals).toContainText('40,000 Gold');
    await expect(totals).toContainText('오검 파편 × 11');
    await expect(totals).toContainText('불타래 × 3');
    await expect(totals).toContainText('얼어붙은 불타래 × 1');
    await expect(panel.getByRole('status')).toContainText('3회 재설정 완료');
}

async function clearSession(page: Page, panel: Locator, totals: Locator, lock: Locator) {
    page.once('dialog', dialog => dialog.dismiss());
    await panel.getByRole('button', { name: '시뮬레이션 초기화' }).click();
    await expect(totals).toContainText('재설정 3회');
    page.once('dialog', dialog => dialog.accept());
    await panel.getByRole('button', { name: '시뮬레이션 초기화' }).click();
    await expect(totals).toContainText('재설정 0회');
    await expect(lock).toHaveAttribute('aria-pressed', 'false');
    await panel.getByRole('button', { name: '현재 효과 직접 설정' }).click();
    await expect(panel.getByRole('combobox', { name: '3번 레벨', exact: true })).toHaveValue('1');
    await expect(panel.getByRole('combobox', { name: '1번 효과', exact: true })).toHaveValue(String(data.effects[0].id));
}

test('configure, lock, reset and clear without network requests', async ({ page }, testInfo) => {
    const { panel, totals, lock } = await configureLockedSession(page);
    const lockedText = await lock.locator('..').innerText();
    // Bring lazy material icons into view before observing reset-only requests.
    await totals.scrollIntoViewIfNeeded();
    await expect.poll(() => totals.locator('img').evaluateAll(images =>
        images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)
    )).toBe(true);
    await page.waitForLoadState('networkidle');
    const requests: string[] = [];
    page.on('request', request => requests.push(request.url()));
    await assertResetAccounting(panel, totals, lock, lockedText);
    expect(requests).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('ogham-reset.png'), fullPage: true });
    await clearSession(page, panel, totals, lock);
});

test('word and grade changes clear only after confirmation, with legal pools and lock limits', async ({ page }) => {
    await page.goto('/simulators/ogham');
    const word = page.getByRole('combobox', { name: '오검 워드', exact: true });
    const grade = page.getByRole('combobox', { name: '등급', exact: true });
    const totals = page.getByRole('region', { name: '누적 소모량' });
    const general = data.words.find(word => !word.special)!;
    await word.selectOption(String(general.id));
    await grade.selectOption('1');
    await expect(page.getByRole('button', { name: '1번 효과 잠금' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '2번 효과 잠금' })).toHaveCount(0);
    await page.getByRole('button', { name: '현재 효과 직접 설정' }).click();
    const effect = page.getByRole('combobox', { name: '1번 효과', exact: true });
    await expect(effect.locator('option')).toHaveCount(data.effects.filter(effect => effect.generalPool).length);
    await expect(effect.locator('option[value="10086"]')).toHaveCount(0);
    await effect.selectOption('10015');
    page.once('dialog', dialog => dialog.dismiss());
    await grade.selectOption('2');
    await expect(grade).toHaveValue('1');
    await expect(effect).toHaveValue('10015');
    page.once('dialog', dialog => dialog.accept());
    await grade.selectOption('2');
    await expect(page.getByRole('button', { name: '2번 효과 잠금' })).toBeVisible();
    await page.getByRole('button', { name: '재설정', exact: true }).click();
    page.once('dialog', dialog => dialog.dismiss());
    await word.selectOption('2');
    await expect(word).toHaveValue(String(general.id));
    await expect(totals).toContainText('재설정 1회');
    page.once('dialog', dialog => dialog.accept());
    await word.selectOption('2');
    await expect(grade).toHaveValue('3');
    await expect(grade.locator('option')).toHaveCount(1);
    await expect(totals).toContainText('재설정 0회');
    await expect(page.getByRole('button', { name: '3번 효과 잠금' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
});

test('home navigation, sitemap and social preview include Ogham', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/simulators/ogham"]').first()).toBeAttached();
    const sitemap = await request.get('/sitemap.xml');
    expect(await sitemap.text()).toContain('https://erinn.me/simulators/ogham');
    const preview = await request.get('/simulators/ogham/preview');
    expect(preview.status()).toBe(200);
    expect(preview.headers()['content-type']).toContain('image/png');
});

test('maximum levels highlight the effect and level, and clear below the maximum', async ({ page }, testInfo) => {
    await page.goto('/simulators/ogham');
    await expect(page.getByRole('heading', { name: '재설정 규칙과 출처' })).toHaveCount(0);
    await page.getByRole('button', { name: '현재 효과 직접 설정' }).click();
    const level = page.getByRole('combobox', { name: '1번 레벨', exact: true });
    const summary = page.getByRole('button', { name: '1번 효과 잠금' }).locator('..').locator('p');
    const normalColor = await summary.first().evaluate(element => getComputedStyle(element).color);
    for (const maximum of [10, 20]) {
        const effect = data.effects.find(effect => effect.values.length === maximum)!;
        await page.getByRole('combobox', { name: '1번 효과', exact: true }).selectOption(String(effect.id));
        await level.selectOption(String(maximum));
        await expect(summary.last()).toHaveText(`(${maximum}/${maximum} 레벨)`);
        for (const line of await summary.all()) await expect(line).toHaveCSS('font-weight', '700');
        const highlightColor = await summary.first().evaluate(element => getComputedStyle(element).color);
        expect(highlightColor).not.toBe(normalColor);
        await expect(summary.last()).toHaveCSS('color', highlightColor);
        await page.screenshot({ path: testInfo.outputPath(`ogham-max-${maximum}.png`), fullPage: true });
        await level.selectOption(String(maximum - 1));
        await expect(summary.first()).toHaveCSS('font-weight', '400');
        await expect(summary.first()).toHaveCSS('color', normalColor);
    }
});
