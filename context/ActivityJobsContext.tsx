import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  fetchRunSnapshot,
  parseActivityRunResult,
  runStatusError,
  startActivityParseRun,
} from '@/services/activityParser';
import { getStoredApiKey } from '@/services/cursorParser';
import {
  deleteActivityParseJob,
  getDisplayActivityParseJobs,
  getResumableActivityParseJobs,
  insertActivityParseJob,
  updateActivityParseJob,
} from '@/services/database';
import type { ActivityEntryInput, ActivityParseJob } from '@/types/profile';

interface ActivityJobsContextValue {
  displayJobs: ActivityParseJob[];
  submitActivityParse: (text: string) => Promise<void>;
  dismissJob: (id: number) => Promise<void>;
  retryJob: (id: number) => Promise<void>;
}

const ActivityJobsContext = createContext<ActivityJobsContextValue | null>(null);

const POLL_INTERVAL_MS = 2000;
const RUN_TIMEOUT_MS = 120_000;

interface ActivityJobsProviderProps {
  children: React.ReactNode;
  logDate: string;
  heightCm: number | null;
  weightKg: number | null;
  onParsed: (entry: ActivityEntryInput) => Promise<void>;
}

export function ActivityJobsProvider({
  children,
  logDate,
  heightCm,
  weightKg,
  onParsed,
}: ActivityJobsProviderProps) {
  const [displayJobs, setDisplayJobs] = useState<ActivityParseJob[]>([]);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const refreshDisplayJobs = useCallback(async () => {
    const jobs = await getDisplayActivityParseJobs(logDate);
    if (mountedRef.current) {
      setDisplayJobs(jobs);
    }
    return jobs;
  }, [logDate]);

  const failJob = useCallback(async (job: ActivityParseJob, message: string) => {
    await updateActivityParseJob(job.id, {
      status: 'failed',
      errorMessage: message,
      completedAt: new Date().toISOString(),
    });
  }, []);

  const completeJob = useCallback(
    async (job: ActivityParseJob, resultText: string) => {
      const parsed = parseActivityRunResult(resultText);
      await onParsed({
        date: job.date,
        rawInput: job.rawInput,
        activityScore: parsed.activityScore,
        bmrCalories: parsed.bmrCalories,
        activityCalories: parsed.activityCalories,
        totalBurnedCalories: parsed.totalBurnedCalories,
        summary: parsed.summary,
      });
      await updateActivityParseJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        errorMessage: null,
      });
    },
    [onParsed],
  );

  const pollRunningJob = useCallback(
    async (job: ActivityParseJob) => {
      if (!job.agentId || !job.runId) {
        await failJob(job, 'Missing Cursor run information.');
        await refreshDisplayJobs();
        return;
      }

      const apiKey = await getStoredApiKey();
      if (!apiKey) {
        await failJob(job, 'Add your Cursor API key in Settings first.');
        await refreshDisplayJobs();
        return;
      }

      const deadline = Date.now() + RUN_TIMEOUT_MS;

      while (Date.now() < deadline) {
        if (!mountedRef.current) return;

        const snapshot = await fetchRunSnapshot(job.agentId, job.runId, apiKey);

        if (snapshot.status === 'FINISHED') {
          await completeJob(job, snapshot.result ?? '');
          await refreshDisplayJobs();
          return;
        }

        const terminalError = runStatusError(snapshot.status);
        if (terminalError) {
          await failJob(job, terminalError);
          await refreshDisplayJobs();
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      await failJob(job, 'Cursor took too long to estimate activity burn. Try again.');
      await refreshDisplayJobs();
    },
    [completeJob, failJob, refreshDisplayJobs],
  );

  const startJobRun = useCallback(
    async (job: ActivityParseJob) => {
      if (heightCm == null || heightCm <= 0 || weightKg == null || weightKg <= 0) {
        await failJob(
          job,
          'Set your height in Profile and log your weight before estimating activity burn.',
        );
        await refreshDisplayJobs();
        return;
      }

      try {
        const { agentId, runId } = await startActivityParseRun(
          job.rawInput,
          heightCm,
          weightKg,
        );

        await updateActivityParseJob(job.id, {
          status: 'running',
          agentId,
          runId,
          errorMessage: null,
        });

        const runningJob: ActivityParseJob = {
          ...job,
          status: 'running',
          agentId,
          runId,
          errorMessage: null,
        };

        await refreshDisplayJobs();
        await pollRunningJob(runningJob);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const isAgentBusy =
          message.includes('409') || message.toLowerCase().includes('agent_busy');

        if (isAgentBusy) {
          await updateActivityParseJob(job.id, {
            status: 'queued',
            agentId: null,
            runId: null,
          });
          await refreshDisplayJobs();
          await new Promise((resolve) => setTimeout(resolve, 3000));
          return;
        }

        await failJob(job, message);
        await refreshDisplayJobs();
      }
    },
    [failJob, heightCm, pollRunningJob, refreshDisplayJobs, weightKg],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      while (mountedRef.current) {
        const jobs = await getResumableActivityParseJobs();
        const runningJob = jobs.find((job) => job.status === 'running');

        if (runningJob) {
          await pollRunningJob(runningJob);
          await refreshDisplayJobs();
          continue;
        }

        const queuedJob = jobs.find((job) => job.status === 'queued');
        if (!queuedJob) break;

        await startJobRun(queuedJob);
        await refreshDisplayJobs();
      }
    } finally {
      processingRef.current = false;
    }
  }, [pollRunningJob, refreshDisplayJobs, startJobRun]);

  const submitActivityParse = useCallback(
    async (text: string) => {
      await insertActivityParseJob(logDate, text);
      await refreshDisplayJobs();
      void processQueue();
    },
    [logDate, processQueue, refreshDisplayJobs],
  );

  const dismissJob = useCallback(
    async (id: number) => {
      await deleteActivityParseJob(id);
      await refreshDisplayJobs();
    },
    [refreshDisplayJobs],
  );

  const retryJob = useCallback(
    async (id: number) => {
      await updateActivityParseJob(id, {
        status: 'queued',
        agentId: null,
        runId: null,
        errorMessage: null,
        completedAt: null,
      });
      await refreshDisplayJobs();
      void processQueue();
    },
    [processQueue, refreshDisplayJobs],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!logDate) return;
    void refreshDisplayJobs().then(() => processQueue());
  }, [logDate, processQueue, refreshDisplayJobs]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void refreshDisplayJobs().then(() => processQueue());
      }
    });

    return () => subscription.remove();
  }, [processQueue, refreshDisplayJobs]);

  const value = useMemo(
    () => ({
      displayJobs,
      submitActivityParse,
      dismissJob,
      retryJob,
    }),
    [dismissJob, displayJobs, retryJob, submitActivityParse],
  );

  return <ActivityJobsContext.Provider value={value}>{children}</ActivityJobsContext.Provider>;
}

export function useActivityJobs() {
  const context = useContext(ActivityJobsContext);
  if (!context) {
    throw new Error('useActivityJobs must be used within ActivityJobsProvider');
  }
  return context;
}
