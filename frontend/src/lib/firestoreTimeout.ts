/** Prevents Firestore from hanging the UI when offline or misconfigured. */
export function firestoreWithTimeout<T>(
  work: Promise<T>,
  fallback: T,
  ms = 2500,
): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}
