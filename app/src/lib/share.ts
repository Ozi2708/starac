import { toBlob } from 'html-to-image';

/** Exporte un nœud DOM en PNG puis le partage (Web Share API) ou le télécharge. */
export async function shareNode(node: HTMLElement, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  await document.fonts?.ready;
  const blob = await toBlob(node, { pixelRatio: 1, cacheBust: true, backgroundColor: '#0d0322' });
  if (!blob) throw new Error('EXPORT_FAILED');
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'shared';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
