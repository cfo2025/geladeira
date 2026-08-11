"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type FeedbackState = { success?: boolean; error?: string };

/**
 * Shows a toast and (optionally) runs a callback exactly once per new
 * useActionState result. The onSuccess call happens during render (the
 * React-sanctioned "adjusting state when a prop changes" pattern) instead of
 * inside an effect, since effects that call setState synchronously trigger
 * react-hooks/set-state-in-effect.
 */
export function useActionFeedback(
  state: FeedbackState,
  options: { successMessage?: string; onSuccess?: () => void } = {}
) {
  const [handledState, setHandledState] = useState(state);

  if (state !== handledState) {
    setHandledState(state);
    if (state.success) {
      options.onSuccess?.();
    }
  }

  useEffect(() => {
    if (state.success) {
      if (options.successMessage) toast.success(options.successMessage);
    } else if (state.error) {
      toast.error(state.error);
    }
    // Reacting only to new action results, not to option identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
