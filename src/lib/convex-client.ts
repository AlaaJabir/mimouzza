import { useEffect, useState, useCallback, useMemo } from 'react';
import { subscribeToStore } from '../../convex/db';

export interface QueryDefinition<Args = any, Result = any> {
  name: string;
  query: (args: Args) => Result;
}

export interface MutationDefinition<Args = any, Result = any> {
  name: string;
  mutation: (args: Args) => Result;
}

/**
 * Convex reactive hook: useQuery
 * Automatically subscribes to DB updates and re-evaluates the query whenever data changes.
 */
export function useQuery<Args, Result>(
  queryDef: QueryDefinition<Args, Result> | null | undefined,
  args?: Args
): Result | undefined {
  const argsKey = useMemo(() => JSON.stringify(args ?? {}), [args]);

  const [data, setData] = useState<Result | undefined>(() => {
    if (!queryDef) return undefined;
    try {
      return queryDef.query(args as Args);
    } catch (e) {
      console.error(`Error executing initial query ${queryDef.name}:`, e);
      return undefined;
    }
  });

  useEffect(() => {
    if (!queryDef) {
      setData(undefined);
      return;
    }

    const runQuery = () => {
      try {
        const result = queryDef.query(args as Args);
        setData(result);
      } catch (err) {
        console.error(`Error executing query ${queryDef.name}:`, err);
      }
    };

    // Run query immediately on mount or dependency change
    runQuery();

    // Subscribe to any changes from mutations (local and cross-tab BroadcastChannel)
    const unsubscribe = subscribeToStore(runQuery);
    return () => {
      unsubscribe();
    };
  }, [queryDef?.name, argsKey]);

  return data;
}

/**
 * Convex mutation hook: useMutation
 * Returns an async-compatible mutation runner that updates the DB and triggers reactive queries.
 */
export function useMutation<Args, Result>(
  mutationDef: MutationDefinition<Args, Result>
): (args: Args) => Promise<Result> {
  return useCallback(
    async (args: Args): Promise<Result> => {
      if (!mutationDef) {
        throw new Error('Invalid mutation definition passed to useMutation');
      }
      try {
        const result = mutationDef.mutation(args);
        return result;
      } catch (err) {
        console.error(`Error executing mutation ${mutationDef.name}:`, err);
        throw err;
      }
    },
    [mutationDef?.name]
  );
}
