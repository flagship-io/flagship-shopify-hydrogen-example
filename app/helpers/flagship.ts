import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
  type NewVisitor,
} from '@flagship.io/react-sdk/edge';
import initialBucketing from './bucketing.json';

/**
 * Function to start the Flagship SDK
 * @returns
 */
export async function startFlagshipSDK() {
  if (
    Flagship.getStatus() &&
    Flagship.getStatus() !== FSSdkStatus.SDK_NOT_INITIALIZED
  ) {
    return Flagship; // If it has been initialized, return early
  }
  return await Flagship.start(
    import.meta.env.VITE_ENV_ID,
    import.meta.env.VITE_API_KEY,
    {
      logLevel: LogLevel.DEBUG, // Set the log level
      fetchNow: false, // Do not fetch flags immediately
      decisionMode: DecisionMode.BUCKETING_EDGE, // set decision mode
      initialBucketing, // Set initial bucketing data
    },
  );
}

/**
 * This function initializes the Flagship SDK and creates a new visitor instance.
 * Use this function on server-side to fetch the visitor data and flags.
 * @param visitorData
 * @returns
 */
export async function getFsVisitorData(visitorData: NewVisitor) {
  // start the SDK in Edge mode
  const flagship = await startFlagshipSDK();

  // Create a visitor
  const visitor = flagship.newVisitor(visitorData);

  // Fetch flag values for the visitor
  await visitor.fetchFlags();

  // Return visitor instance
  return visitor;
}
