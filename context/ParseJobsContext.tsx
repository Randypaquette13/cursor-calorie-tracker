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
  getStoredApiKey,
  parseRunResult,
  runStatusError,
  startParseRun,
} from '@/services/cursorParser';
import {
  deleteParseJob,
  getDisplayParseJobs,
  getResumableParseJobs,
  getSavedFoods,
  insertParseJob,
  updateParseJob,
} from '@/services/database';
import type { FoodEntryInput, MealType, ParseJob } from '@/types/food';
import { inferMealType } from '@/utils/meal';

interface ParseJobsContextValue {
  displayJobs: ParseJob[];
  submitParse: (text: string) => Promise<void>;
  dismissJob: (id: number) => Promise<void>;
  retryJob: (id: number) => Promise<void>;
}

const ParseJobsContext = createContext<ParseJobsContextValue | null>(null);

const POLL_INTERVAL_MS = 2000;
const RUN_TIMEOUT_MS = 120_000;

interface ParseJobsProviderProps {
  children: React.ReactNode;
  logDate: string;
  onParsed: (entries: FoodEntryInput[], options?: { rawInput?: string | null }) => Promise<void>;
}

export function ParseJobsProvider({ children, logDate, onParsed }: ParseJobsProviderProps) {
  const [displayJobs, setDisplayJobs] = useState<ParseJob[]>([]);
  const processingRef = useRef(false);
  const mountedRef = useRef(true);

  const refreshDisplayJobs = useCallback(async () => {
    const jobs = await getDisplayParseJobs(logDate);
    if (mountedRef.current) {
      setDisplayJobs(jobs);
    }
    return jobs;
  }, [logDate]);

  const completeJob = useCallback(
    async (job: ParseJob, resultText: string) => {
      const savedFoods = await getSavedFoods();
      const parsed = parseRunResult(resultText, job.rawInput, savedFoods);

      await onParsed(
        parsed.items.map((item) => ({
          mealType: (item.mealType ?? inferMealType(job.rawInput)) as MealType,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          caloriesMin: item.caloriesMin,
          caloriesMax: item.caloriesMax,
          proteinMin: item.proteinMin,
          proteinMax: item.proteinMax,
          carbsMin: item.carbsMin,
          carbsMax: item.carbsMax,
          fatMin: item.fatMin,
          fatMax: item.fatMax,
          source: 'natural_language' as const,
        })),
        { rawInput: job.rawInput },
      );

      await updateParseJob(job.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        errorMessage: null,
      });
    },
    [onParsed],
  );

  const failJob = useCallback(async (job: ParseJob, message: string) => {
    await updateParseJob(job.id, {
      status: 'failed',
      errorMessage: message,
      completedAt: new Date().toISOString(),
    });
  }, []);

  const pollRunningJob = useCallback(
    async (job: ParseJob) => {
      if (!job.agentId || !job.runId) {
        await failJob(job, 'Missing Cursor run information.');
        return;
      }

      const apiKey = await getStoredApiKey();
      if (!apiKey) {
        await failJob(job, 'Add your Cursor API key in Settings first.');
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

      await failJob(job, 'Cursor took too long to parse this meal. Try again.');
      await refreshDisplayJobs();
    },
    [completeJob, failJob, refreshDisplayJobs],
  );

  const startJobRun = useCallback(
    async (job: ParseJob) => {
      try {
        const savedFoods = await getSavedFoods();
        const { agentId, runId } = await startParseRun(job.rawInput, savedFoods);

        await updateParseJob(job.id, {
          status: 'running',
          agentId,
          runId,
          errorMessage: null,
        });

        const runningJob: ParseJob = {
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
          await updateParseJob(job.id, {
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
    [failJob, pollRunningJob, refreshDisplayJobs],
  );

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      while (mountedRef.current) {
        const jobs = await getResumableParseJobs();
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

  const submitParse = useCallback(
    async (text: string) => {
      await insertParseJob(logDate, text);
      await refreshDisplayJobs();
      void processQueue();
    },
    [logDate, processQueue, refreshDisplayJobs],
  );

  const dismissJob = useCallback(
    async (id: number) => {
      await deleteParseJob(id);
      await refreshDisplayJobs();
    },
    [refreshDisplayJobs],
  );

  const retryJob = useCallback(
    async (id: number) => {
      await updateParseJob(id, {
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
      submitParse,
      dismissJob,
      retryJob,
    }),
    [dismissJob, displayJobs, retryJob, submitParse],
  );

  return <ParseJobsContext.Provider value={value}>{children}</ParseJobsContext.Provider>;
}

export function useParseJobs() {
  const context = useContext(ParseJobsContext);
  if (!context) {
    throw new Error('useParseJobs must be used within ParseJobsProvider');
  }
  return context;
}

export function useParseJobsOptional() {
  return useContext(ParseJobsContext);
}
