export function getRetryDelay(attempt, isTestMode) {
  if (isTestMode) {
    // Required test intervals (seconds)
    const testDelays = [0, 5, 10, 15, 20];
    return testDelays[attempt - 1] ?? null;
  }

  
  const prodDelays = [
    0,        // attempt 1
    60,       // attempt 2
    300,      // attempt 3
    1800,     // attempt 4
    7200      // attempt 5
  ];

  return prodDelays[attempt - 1] ?? null;
}
