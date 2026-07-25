import JSZip from 'jszip';
import { toDirectImageUrl } from '@/lib/driveUtils';
import { Post, Client } from '@/types';

const MONTH_ABBR_PT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/**
 * Get the week number within the month (1-based).
 * Week 1 starts on day 1, week 2 on day 8, etc.
 */
function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

/**
 * Get the post number for a client within the same week.
 * Sorts all posts from same client in that week by date/creation and returns 1-based index.
 */
function getPostNumberInWeek(post: Post, allPosts: Post[]): number {
  const postDate = new Date(post.dataPublicacao);
  const weekOfMonth = getWeekOfMonth(postDate);
  const month = postDate.getMonth();
  const year = postDate.getFullYear();

  const sameWeekPosts = allPosts
    .filter(p => {
      if (p.clienteId !== post.clienteId) return false;
      const d = new Date(p.dataPublicacao);
      return d.getFullYear() === year && d.getMonth() === month && getWeekOfMonth(d) === weekOfMonth;
    })
    .sort((a, b) => {
      const diff = new Date(a.dataPublicacao).getTime() - new Date(b.dataPublicacao).getTime();
      return diff !== 0 ? diff : a.criadoEm.localeCompare(b.criadoEm);
    });

  const index = sameWeekPosts.findIndex(p => p.id === post.id);
  return index + 1;
}

/**
 * Build folder name: C | SX/MMM | PY | SZ
 */
export function buildFolderName(post: Post, clientName: string, allPosts: Post[]): string {
  const postDate = new Date(post.dataPublicacao);
  const weekNum = getWeekOfMonth(postDate);
  const monthAbbr = MONTH_ABBR_PT[postDate.getMonth()];
  const postNum = getPostNumberInWeek(post, allPosts);
  const artCount = post.artes.length;

  return `${clientName} | S${weekNum}/${monthAbbr} | P${postNum} | S${artCount}`;
}

/**
 * Download all artes as a ZIP with the standardised folder name.
 */
export async function downloadArtes(post: Post, clientName: string, allPosts: Post[]): Promise<void> {
  if (post.artes.length === 0) throw new Error('Nenhuma arte para baixar');

  const folderName = buildFolderName(post, clientName, allPosts);
  const zip = new JSZip();
  const folder = zip.folder(folderName)!;

  const results = await Promise.allSettled(
    post.artes.map(async (url, i) => {
      const directUrl = toDirectImageUrl(url);
      const res = await fetch(directUrl);
      if (!res.ok) throw new Error(`Falha ao baixar imagem ${i + 1}`);
      const blob = await res.blob();
      const ext = getExtension(res.headers.get('content-type'), url);
      folder.file(`arte-${i + 1}.${ext}`, blob);
    })
  );

  const failures = results.filter(r => r.status === 'rejected').length;
  if (failures === post.artes.length) throw new Error('Não foi possível baixar nenhuma arte');

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (failures > 0) {
    return Promise.reject(new Error(`${failures} arte(s) não puderam ser baixadas`));
  }
}

function getExtension(contentType: string | null, url: string): string {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  if (contentType?.includes('svg')) return 'svg';
  // Try from URL
  const match = url.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?|$)/i);
  if (match) return match[1].toLowerCase();
  return 'jpg';
}
