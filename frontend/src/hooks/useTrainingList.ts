"use client";
import { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "@/constants/api";
import { toast, TOAST_DURATION } from "@/utils/toast";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "@/constants/messages";

// Types
export interface Exercise {
  exercise_id: string;
  exercise_name: string;
  sets: {
    reps: number;
    weight: number;
  }[];
  notes?: string;
}

export interface TrainingSession {
  id: string;
  customer_id: string;
  date: string;
  exercises: Exercise[];
  notes: string;
  duration_minutes: number;
}

export interface Customer {
  id: string;
  name: string;
}

export interface GroupedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: { reps: number; weight: number }[];
  notes: string[];
  sessionIds: string[];
}

// Standalone utility function for grouping exercises by name
export function groupExercisesByName(
  dateSessions: TrainingSession[]
): GroupedExercise[] {
  const grouped: { [exerciseName: string]: GroupedExercise } = {};

  dateSessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      if (!grouped[exercise.exercise_name]) {
        grouped[exercise.exercise_name] = {
          exercise_id: exercise.exercise_id,
          exercise_name: exercise.exercise_name,
          sets: [],
          notes: [],
          sessionIds: [],
        };
      }
      grouped[exercise.exercise_name].sets.push(...exercise.sets);
      if (exercise.notes && exercise.notes.trim()) {
        grouped[exercise.exercise_name].notes.push(exercise.notes);
      }
      if (!grouped[exercise.exercise_name].sessionIds.includes(session.id)) {
        grouped[exercise.exercise_name].sessionIds.push(session.id);
      }
    });
  });

  return Object.values(grouped);
}

interface UseTrainingListReturn {
  // State
  customer: Customer | null;
  sessions: TrainingSession[];
  loading: boolean;
  deleteId: string | null;
  deleteSessionIds: string[];
  selectedDeleteSessionId: string | null;
  aiAdvice: string;
  loadingAdvice: boolean;
  cachedUntil: string | null;

  // Computed
  groupedSessionsByDate: [string, TrainingSession[]][];

  // Actions
  setDeleteId: (id: string | null) => void;
  setDeleteSessionIds: (ids: string[]) => void;
  setSelectedDeleteSessionId: (id: string | null) => void;
  setAiAdvice: (advice: string) => void;
  setCachedUntil: (until: string | null) => void;
  handleDelete: (sessionId: string) => Promise<void>;
  handleDeleteClick: (sessionIds: string[]) => void;
  handleCancelMultiDelete: () => void;
  handleConfirmMultiDelete: () => void;
  handleGetAdvice: () => Promise<void>;
  getTotalVolume: (exercise: Exercise) => number;
}

export function useTrainingList(customerId: string): UseTrainingListReturn {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteSessionIds, setDeleteSessionIds] = useState<string[]>([]);
  const [selectedDeleteSessionId, setSelectedDeleteSessionId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [cachedUntil, setCachedUntil] = useState<string | null>(null);

  // Fetch customer data
  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CUSTOMER(customerId));
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  }, [customerId]);

  // Fetch training sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(
        API_ENDPOINTS.TRAINING_SESSIONS(customerId, 20)
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Error fetching training sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Initialize data
  useEffect(() => {
    document.title = "トレーニング記録 | MII Fit";
    fetchCustomer();
    fetchSessions();
  }, [fetchCustomer, fetchSessions]);

  // Calculate total volume for an exercise
  const getTotalVolume = useCallback((exercise: Exercise): number => {
    return exercise.sets.reduce(
      (total, set) => total + set.reps * set.weight,
      0
    );
  }, []);

  // Group sessions by date
  const groupSessionsByDate = useCallback((): [string, TrainingSession[]][] => {
    const grouped: { [date: string]: TrainingSession[] } = {};

    sessions.forEach((session) => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });

    return Object.entries(grouped).sort(
      ([dateA], [dateB]) =>
        new Date(dateB).getTime() - new Date(dateA).getTime()
    );
  }, [sessions]);

  // Delete a session
  const handleDelete = useCallback(
    async (sessionId: string) => {
      try {
        const response = await fetch(
          API_ENDPOINTS.DELETE_TRAINING_SESSION(sessionId),
          { method: "DELETE" }
        );
        if (response.ok) {
          toast.success(SUCCESS_MESSAGES.DELETED());
          setDeleteId(null);
          setDeleteSessionIds([]);
          setSelectedDeleteSessionId(null);
          fetchSessions();
        } else {
          toast.error(ERROR_MESSAGES.DELETION_FAILED());
        }
      } catch (err) {
        toast.error("ネットワークエラーが発生しました");
        console.error("Error deleting session:", err);
      }
    },
    [fetchSessions]
  );

  // Handle delete button click
  const handleDeleteClick = useCallback((sessionIds: string[]) => {
    if (sessionIds.length === 1) {
      setDeleteId(sessionIds[0]);
    } else {
      setDeleteSessionIds(sessionIds);
      setSelectedDeleteSessionId(sessionIds[0]);
    }
  }, []);

  // Cancel multi-delete
  const handleCancelMultiDelete = useCallback(() => {
    setDeleteSessionIds([]);
    setSelectedDeleteSessionId(null);
  }, []);

  // Confirm multi-delete
  const handleConfirmMultiDelete = useCallback(() => {
    if (selectedDeleteSessionId) {
      handleDelete(selectedDeleteSessionId);
    }
  }, [selectedDeleteSessionId, handleDelete]);

  // Get AI advice
  const handleGetAdvice = useCallback(async () => {
    setLoadingAdvice(true);
    setAiAdvice("");
    setCachedUntil(null);
    try {
      const response = await fetch(API_ENDPOINTS.TRAINING_ADVICE(customerId));
      if (response.ok) {
        const data = await response.json();
        setAiAdvice(data.advice);
        if (data.is_cached && data.cached_until) {
          setCachedUntil(data.cached_until);
        }
      } else {
        const error = await response.json();
        toast.error(
          `アドバイス取得に失敗: ${error.error}`,
          TOAST_DURATION.LONG
        );
      }
    } catch (err) {
      toast.error("ネットワークエラーが発生しました");
      console.error("Error fetching advice:", err);
    } finally {
      setLoadingAdvice(false);
    }
  }, [customerId]);

  return {
    // State
    customer,
    sessions,
    loading,
    deleteId,
    deleteSessionIds,
    selectedDeleteSessionId,
    aiAdvice,
    loadingAdvice,
    cachedUntil,

    // Computed
    groupedSessionsByDate: groupSessionsByDate(),

    // Actions
    setDeleteId,
    setDeleteSessionIds,
    setSelectedDeleteSessionId,
    setAiAdvice,
    setCachedUntil,
    handleDelete,
    handleDeleteClick,
    handleCancelMultiDelete,
    handleConfirmMultiDelete,
    handleGetAdvice,
    getTotalVolume,
  };
}
