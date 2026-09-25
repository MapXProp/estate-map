import { mapCategoryGroups, normalizeMapCategories, validMapCategoryIds } from './propertyMapSearch'

// Land is one choice across channels. Keep the original category IDs so existing
// links, shared-use types and the map/list switch retain their meaning.
export const browseTypeGroups = [
  ...mapCategoryGroups.map((group) => {
    const visible = (option: (typeof group.options)[number]) =>
      option.propertyType !== 'land' &&
      (group.code !== 'homes' || !['shophouse', 'home_office'].includes(option.propertyType))
    return {
      ...group,
      options: group.options.filter(visible),
      sections: group.sections.map((section) => ({ ...section, options: section.options.filter(visible) })),
    }
  }),
  {
    code: 'land',
    nameTh: 'ที่ดิน',
    nameEn: 'Land',
    options: mapCategoryGroups[0].options.filter((option) => option.propertyType === 'land'),
    sections: [],
  },
]

export function normalizeBrowseTypeSelection(categories: string[]) {
  const selected = normalizeMapCategories(categories)
  return selected.length === validMapCategoryIds.size ? [] : selected
}

export function browseTypeGroupState(categories: string[], code: string) {
  const group = browseTypeGroups.find((group) => group.code === code)
  const selected = new Set(normalizeBrowseTypeSelection(categories))
  const count = group?.options.filter((option) => selected.has(option.id)).length || 0
  return {
    count,
    all: !!group && count === group.options.length,
    partial: count > 0 && count < (group?.options.length || 0),
  }
}

export function setBrowseTypeGroup(categories: string[], code: string, enabled: boolean) {
  const selected = normalizeBrowseTypeSelection(categories)
  const group = browseTypeGroups.find((group) => group.code === code)
  if (!group) return selected
  const ids = new Set(normalizeMapCategories(group.options.map((option) => option.id)))
  return normalizeBrowseTypeSelection(enabled ? [...selected, ...ids] : selected.filter((id) => !ids.has(id)))
}
