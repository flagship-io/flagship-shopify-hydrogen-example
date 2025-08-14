import {
  FlagshipProvider,
  LogLevel,
  SerializedFlagMetadata,
} from '@flagship.io/react-sdk/edge';

export function FsProvider({
  children,
  initialFlagsData,
}: {
  children: React.ReactNode;
  initialFlagsData?: SerializedFlagMetadata[];
}) {
  return (
    <>
      <FlagshipProvider
        envId={import.meta.env.VITE_ENV_ID}
        apiKey={import.meta.env.VITE_API_KEY}
        // logLevel={LogLevel.DEBUG}
        initialFlagsData={initialFlagsData}
        visitorData={{
          id: 'visitorId',
          hasConsented: true,
          context: {
            key: 'value',
          },
        }}
      >
        {children}
      </FlagshipProvider>
    </>
  );
}
