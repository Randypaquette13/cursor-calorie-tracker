import { useFood } from '@/context/FoodContext';
import { ParseJobsProvider } from '@/context/ParseJobsContext';

export function ParseJobsBridge({ children }: { children: React.ReactNode }) {
  const { logDate, addEntries } = useFood();

  return (
    <ParseJobsProvider logDate={logDate} onParsed={addEntries}>
      {children}
    </ParseJobsProvider>
  );
}
