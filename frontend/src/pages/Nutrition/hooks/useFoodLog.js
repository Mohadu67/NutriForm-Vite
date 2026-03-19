import { useState, useCallback } from 'react';
import { addFoodLog, logRecipe, updateFoodLog, deleteFoodLog } from '../../../shared/api/nutrition';

export function useFoodLog(onSuccess) {
  const [submitting, setSubmitting] = useState(false);

  const addManual = useCallback(async (data) => {
    try {
      setSubmitting(true);
      const result = await addFoodLog(data);
      onSuccess?.();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess]);

  const addRecipe = useCallback(async (data) => {
    try {
      setSubmitting(true);
      const result = await logRecipe(data);
      onSuccess?.();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess]);

  const update = useCallback(async (id, data) => {
    try {
      setSubmitting(true);
      const result = await updateFoodLog(id, data);
      onSuccess?.();
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess]);

  const remove = useCallback(async (id) => {
    try {
      setSubmitting(true);
      await deleteFoodLog(id);
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  }, [onSuccess]);

  return { addManual, addRecipe, update, remove, submitting };
}
