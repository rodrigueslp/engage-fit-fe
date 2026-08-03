import type { Source } from '../api/types';

export const sources: Source[] = ['wellhub', 'totalpass', 'box_member'];

export function sourceLabel(source: Source | string) {
  if (source === 'wellhub') return 'Wellhub';
  if (source === 'totalpass') return 'TotalPass';
  if (source === 'box_member') return 'Mensalista do box';
  return source;
}
