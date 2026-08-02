import { useFood } from '@/context/FoodContext';
import { useProfile } from '@/context/ProfileContext';
import { ActivityJobsProvider } from '@/context/ActivityJobsContext';
import { ActivityProvider, useActivity } from '@/context/ActivityContext';

function ActivityJobsInner({ children }: { children: React.ReactNode }) {
  const { logDate, refresh: refreshFood } = useFood();
  const { profile, latestWeight } = useProfile();
  const { addActivityEntry } = useActivity();

  return (
    <ActivityJobsProvider
      logDate={logDate}
      heightCm={profile.heightCm}
      weightKg={latestWeight?.weightKg ?? null}
      onParsed={addActivityEntry}>
      {children}
    </ActivityJobsProvider>
  );
}

export function ActivityJobsBridge({ children }: { children: React.ReactNode }) {
  const { logDate, refresh: refreshFood } = useFood();

  return (
    <ActivityProvider date={logDate} onChanged={refreshFood}>
      <ActivityJobsInner>{children}</ActivityJobsInner>
    </ActivityProvider>
  );
}
