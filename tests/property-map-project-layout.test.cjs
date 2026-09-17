const assert = require('node:assert/strict')
const { test } = require('node:test')
const { load } = require('./helpers/property-prices.cjs')
const { projectMarkerSize, layoutProjectLabels } = load('src/lib/propertyMapProjectLayout.ts')
const plain = value => JSON.parse(JSON.stringify(value))
const candidate = (id, x, y, options = {}) => ({
  id, pin: { left: x - 10, right: x + 10, top: y - 10, bottom: y + 10 },
  width: 160, height: 30, active: false, ...options,
})
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

test('project sizes are continuous and bounded on phones and desktop, including fractional and invalid zoom', () => {
  for (const mobile of [true, false]) {
    const min = mobile ? 16 : 18
    const max = min + 8
    assert.equal(projectMarkerSize(1, mobile), min)
    assert.equal(projectMarkerSize(25, mobile), max)
    assert.ok(Number.isFinite(projectMarkerSize(NaN, mobile)))
    let previous = min
    for (let zoom = 10; zoom <= 18; zoom += 0.05) {
      const size = projectMarkerSize(zoom, mobile)
      assert.ok(size >= previous && size <= max)
      assert.ok(size - previous < 0.1, 'small zoom changes never produce a size step')
      previous = size
    }
  }
})

test('sparse names appear before street zoom while dense names share space in priority order', () => {
  const viewport = { left: 0, top: 0, right: 320, bottom: 240 }
  const crowded = ['paid', 'new', 'other'].map(id => candidate(id, 160, 120, { width: 240, height: 34 }))
  const before = plain(crowded)
  const result = layoutProjectLabels(crowded, viewport, [], 11, true)
  assert.equal(result[0].placement, 'top')
  assert.equal(result[1].placement, 'bottom')
  assert.equal(result[2].rect, undefined)
  assert.ok(!overlaps(result[0].rect, result[1].rect))
  assert.deepEqual(plain(crowded), before, 'screen label placement cannot move the project pins')
  assert.ok(layoutProjectLabels([candidate('only', 160, 120)], viewport, [], 10, true)[0].rect)
})

test('labels avoid project icons, screen edges, search bars and result panels and keep a viable placement', () => {
  const viewport = { left: 0, top: 0, right: 390, bottom: 600 }
  const obstacles = [{ left: 0, top: 0, right: 390, bottom: 90 }, { left: 0, top: 500, right: 390, bottom: 600 }]
  const rows = [candidate('edge', 24, 170, { width: 120 }), candidate('lower', 250, 350)]
  const result = layoutProjectLabels(rows, viewport, obstacles, 13, true)
  assert.equal(result[0].placement, 'right')
  for (const { rect, candidate: source } of result.filter(row => row.rect)) {
    assert.ok(rect.left >= 6 && rect.right <= 384 && rect.top >= 6 && rect.bottom <= 594)
    assert.ok(obstacles.every(obstacle => !overlaps(rect, obstacle)))
    assert.ok(rows.filter(row => row !== source).every(row => !overlaps(rect, row.pin)))
  }
  const stable = layoutProjectLabels([{ ...rows[0], previousPlacement: 'right' }], viewport, obstacles, 14, true)
  assert.equal(stable[0].placement, 'right')
  assert.equal(layoutProjectLabels([candidate('behind-panel', 160, 560, { active: true })], viewport, obstacles, 17, true)[0].rect, undefined)
})

test('active projects can claim a crowded label position and zooming in gradually allows more names', () => {
  const viewport = { left: 0, top: 0, right: 320, bottom: 600 }
  const rows = [candidate('selected', 160, 100, { active: true }), candidate('new', 160, 260), candidate('older', 160, 420)]
  const overview = layoutProjectLabels(rows, viewport, [], 10, true)
  const close = layoutProjectLabels(rows, viewport, [], 17, true)
  assert.ok(overview[0].rect)
  assert.equal(overview.filter(row => row.rect).length, 2)
  assert.equal(close.filter(row => row.rect).length, 3)
  for (let i = 0; i < close.length; i++)
    for (let j = i + 1; j < close.length; j++) assert.ok(!overlaps(close[i].rect, close[j].rect))
  assert.equal(layoutProjectLabels([candidate('offscreen', -30, 100, { active: true })], viewport, [], 17, true)[0].rect, undefined)
})
