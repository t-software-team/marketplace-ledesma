const BLOCKED_WORDS = [
  'puta',
  'puto',
  'pendejo',
  'boludo',
  'forro',
  'mierda',
  'concha',
  'pelotudo',
  'idiota',
  'gil',
  'cornudo',
  'trolo',
  'trola',
  'garca',
  'chorro',
  'negro de mierda',
  'puto el que lee',
]

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function containsProfanity(text: string): boolean {
  const normalized = normalize(text)
  return BLOCKED_WORDS.some((word) => normalized.includes(word))
}
