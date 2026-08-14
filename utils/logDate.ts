import { format, parseISO, subDays } from 'date-fns';

export function formatLogDateLabel(logDate: string, today: string) {
  if (logDate === today) return 'Today';
  if (logDate === format(subDays(parseISO(today), 1), 'yyyy-MM-dd')) return 'Yesterday';

  try {
    return format(parseISO(logDate), 'EEEE, MMM d');
  } catch {
    return logDate;
  }
}
