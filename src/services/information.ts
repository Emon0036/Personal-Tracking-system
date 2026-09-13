export interface Article { id: string; title: string; description: string; category: string; source: string; url: string; publishedAt: string; deadline: string; tags: string[]; image: string; location: string; type: string }
interface Provider { id: string; name: string; categories: string[]; fetch: (signal: AbortSignal) => Promise<Article[]> }
const providers: Provider[] = [
  { id: 'devto', name: 'DEV Community', categories: ['AI / ML', 'Software Engineering', 'CSE', 'Career'], async fetch(signal) {
    const response = await fetch('https://dev.to/api/articles?per_page=30', { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!response.ok) throw new Error(`DEV Community returned ${response.status}.`)
    const rows: unknown = await response.json()
    if (!Array.isArray(rows)) throw new Error('The provider returned an unexpected response.')
    return rows.filter(row => row && typeof row.title === 'string' && typeof row.url === 'string').map(row => {
      const tags = Array.isArray(row.tag_list) ? row.tag_list.filter((tag: unknown) => typeof tag === 'string') as string[] : []
      return { id: `devto-${row.id}`, title: row.title, description: typeof row.description === 'string' ? row.description : '', category: tags.some(tag => /^(ai|machinelearning|llm|datascience|deeplearning)$/.test(tag)) ? 'AI / ML' : tags.some(tag => /career|beginners/.test(tag)) ? 'Career' : 'Software Engineering', source: 'DEV Community', url: row.url, publishedAt: typeof row.published_at === 'string' ? row.published_at : '', deadline: '', tags, image: '', location: '', type: 'Article' }
    })
  } },
  { id: 'hn', name: 'Hacker News / Algolia', categories: ['AI / ML', 'Software Engineering', 'CSE'], async fetch(signal) {
    const response = await fetch('https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=30&numericFilters=points%3E10', { signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!response.ok) throw new Error(`Hacker News returned ${response.status}.`)
    const result = await response.json()
    if (!Array.isArray(result.hits)) throw new Error('The provider returned an unexpected response.')
    return result.hits.filter((row: { title?: unknown; url?: unknown }) => typeof row.title === 'string' && typeof row.url === 'string').map((row: { objectID: string; title: string; url: string; created_at: string }) => ({ id: `hn-${row.objectID}`, title: row.title, description: 'Community-submitted technology news. Read the original source for context.', category: /\b(ai|llm|machine learning|model|neural)\b/i.test(row.title) ? 'AI / ML' : 'CSE', source: 'Hacker News', url: row.url, publishedAt: row.created_at, deadline: '', tags: /\b(ai|llm|machine learning)\b/i.test(row.title) ? ['AI'] : ['Software Engineering'], image: '', location: '', type: 'Article' }))
  } },
]
const cache = new Map<string, { at: number; articles: Article[] }>()
export async function getInformation(signal: AbortSignal, force = false): Promise<{ articles: Article[]; errors: string[] }> {
  const results = await Promise.allSettled(providers.map(async provider => {
    const previous = cache.get(provider.id)
    if (!force && previous && Date.now() - previous.at < 15 * 60000) return previous.articles
    const articles = await provider.fetch(signal)
    cache.set(provider.id, { at: Date.now(), articles })
    return articles
  }))
  return { articles: [...new Map(results.flatMap(result => result.status === 'fulfilled' ? result.value : []).map(article => [article.url, article])).values()], errors: results.flatMap((result, index) => result.status === 'rejected' ? [`${providers[index].name} is unavailable. Try again later.`] : []) }
}
export const officialSources = [
  { title: 'Google AI research', category: 'AI / ML', description: 'Research and updates from Google Research.', url: 'https://research.google/blog/' },
  { title: 'Hugging Face', category: 'AI / ML', description: 'Open-source models, datasets, and community research.', url: 'https://huggingface.co/blog' },
  { title: 'React', category: 'Software Engineering', description: 'Official React releases and engineering updates.', url: 'https://react.dev/blog' },
  { title: 'GitHub Blog', category: 'Software Engineering', description: 'Official GitHub and open-source updates.', url: 'https://github.blog/' },
  { title: 'ACM', category: 'CSE', description: 'Computing research, education, and professional resources.', url: 'https://www.acm.org/' },
  { title: 'Google Summer of Code', category: 'Career', description: 'Official open-source contributor program. Check current eligibility and dates.', url: 'https://summerofcode.withgoogle.com/' },
  { title: 'Codeforces contests', category: 'Competitions', description: 'Official programming contest calendar.', url: 'https://codeforces.com/contests' },
  { title: 'Kaggle competitions', category: 'Competitions', description: 'Data science and machine learning competitions. Review each event’s rules.', url: 'https://www.kaggle.com/competitions' },
  { title: 'Major League Hacking', category: 'Hackathons', description: 'Student hackathon directory. Check the organizer for current deadlines.', url: 'https://mlh.io/seasons/2027/events' },
  { title: 'Devpost', category: 'Hackathons', description: 'Hackathon listings. Verify details on the organizer’s page.', url: 'https://devpost.com/hackathons' },
  { title: 'DAAD study programmes', category: 'Study Abroad', description: 'Official German academic exchange programme directory.', url: 'https://www.daad.de/en/studying-in-germany/universities/all-degree-programmes/' },
  { title: 'Study UK', category: 'Study Abroad', description: 'British Council guidance on UK study options.', url: 'https://study-uk.britishcouncil.org/' },
  { title: 'Erasmus Mundus Joint Masters', category: 'Scholarships', description: 'Official EU programme information. Check individual programmes for funding and deadlines.', url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters' },
  { title: 'DAAD scholarship database', category: 'Scholarships', description: 'Official funding search. Eligibility varies by programme and country.', url: 'https://www.daad.de/en/studying-in-germany/scholarships/daad-scholarships/' },
]
