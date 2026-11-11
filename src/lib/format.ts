const timeFormat = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const formatTime = (timestamp: number) => timeFormat.format(new Date(timestamp));

/** Decodifica entidades HTML (&amp;, &#39;...) que a API do YouTube devolve nos títulos. */
export function decodeEntities(text: string): string {
  if (!text.includes('&')) return text;
  const doc = new DOMParser().parseFromString(`<!doctype html><body>${text}`, 'text/html');
  return doc.body.textContent ?? text;
}
