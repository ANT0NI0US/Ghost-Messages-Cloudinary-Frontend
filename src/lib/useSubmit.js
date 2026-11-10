import { useCallback, useState } from "react";

/*
  Wraps a form action: tracks busy state, the general error and per-field errors
  coming from the backend validation issues (error.fields).
*/
export const useSubmit = (action) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({});

  const run = useCallback(
    async (...args) => {
      setBusy(true);
      setError(null);
      setFields({});
      try {
        return await action(...args);
      } catch (caught) {
        setError(caught);
        setFields(caught.fields ?? {});
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [action],
  );

  return { run, busy, error, fields, setError };
};
