import {
  DecisionMode,
  FlagshipProvider,
  LogLevel,
  SerializedFlagMetadata,
  VisitorData,
} from '@flagship.io/react-sdk/edge';

export function FsProvider({
  children,
  initialFlagsData,
  visitorData,
}: {
  children: React.ReactNode;
  initialFlagsData?: SerializedFlagMetadata[];
  visitorData?: VisitorData;
}) {
  return (
    <>
      <FlagshipProvider
        envId={import.meta.env.VITE_ENV_ID}
        apiKey={import.meta.env.VITE_API_KEY}
        logLevel={LogLevel.DEBUG}
        initialFlagsData={initialFlagsData}
        visitorData={visitorData || null}
      >
        {children}
      </FlagshipProvider>
    </>
  );
}
