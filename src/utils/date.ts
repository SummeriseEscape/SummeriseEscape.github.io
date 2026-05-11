export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function readingTime(content: string): number {
  const wordsPerMinute = 200;
  const chineseChars = (content.match(/[一-鿿]/g) || []).length;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil((chineseChars + words) / wordsPerMinute));
}
