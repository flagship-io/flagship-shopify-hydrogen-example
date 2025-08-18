# Flagship + Shopify Hydrogen Integration

> 📘 Github Repository
>
> [https://github.com/flagship-io/flagship-hydrogen-example](https://github.com/flagship-io/flagship-hydrogen-example)

## Overview

This guide demonstrates how to:

* Integrate Flagship feature flags with Shopify Hydrogen (React-based framework)
* Initialize the Flagship SDK with edge bucketing for optimal performance
* Create visitor objects with contextual data
* Use feature flags in React components
* Handle server-side rendering with Flagship
* Implement client-side hydration of feature flags
* Conditionally display content based on feature flags

## Prerequisites

* [Node.js](https://nodejs.org/)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* A [Shopify store](https://www.shopify.com/)
* A [Flagship account](https://app.flagship.io/login) with API credentials

## Setup

1. Clone the example repository:

```bash
git clone https://github.com/flagship-io/flagship-hydrogen-example
cd flagship-hydrogen-example
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Configure environment variables:

Create a .env file with your Flagship credentials:

```bash
VITE_ENV_ID=your_flagship_environment_id
VITE_API_KEY=your_flagship_api_key
```

4. Start the development server:

```bash
npm run dev
# or
yarn dev
```

## Configure Vite for Flagship SDK

When using Flagship SDK with Hydrogen, proper Vite configuration is essential to prevent bundling issues. Update your vite.config.ts file with the following settings:

```typescript
export default defineConfig({
  // ...other configuration
  optimizeDeps: {
    exclude: [
      '@flagship.io/react-sdk',
      '@flagship.io/react-sdk/edge'
    ],
  },
  ssr: {
    optimizeDeps: {
      include: [],
      exclude: [],
    },
  },
});
```

This configuration:

* Excludes both the main and edge bundles from client-side optimization
* Prevents Vite from processing the SDK in ways that might break its functionality

> ⚠️ **Important**: In Hydrogen (and other edge/SSR environments), always import from the edge bundle:
>
> ```tsx
> // Correct import for Hydrogen
> import { ... } from '@flagship.io/react-sdk/edge';
> ```

## Initialize Flagship SDK in Hydrogen

The Flagship SDK is initialized at the application level to ensure it's available throughout your Hydrogen store. This is done in the flagship.ts helper file:

```typescript
import {
  Flagship,
  FSSdkStatus,
  DecisionMode,
  LogLevel,
  type NewVisitor,
} from '@flagship.io/react-sdk/edge';
import initialBucketing from './bucketing.json';

// Function to start the Flagship SDK
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
      nextFetchConfig: {revalidate: 15}, // Set cache revalidation for SDK routes to 15 seconds
      initialBucketing, // Set initial bucketing data
    },
  );
}
```

The SDK is configured with:

* **Edge Bucketing Mode**: Makes flag decisions at the edge without API calls
* **Initial Bucketing Data**: Pre-loaded campaign data for local decision-making
* **Revalidation Config**: Refreshes cached flags every 15 seconds
* **Debug Logging**: Helps troubleshoot during development

## Create a Visitor in Hydrogen's Root Loader

In Hydrogen, the ideal place to create the Flagship visitor is in the root loader function. This ensures it's available for both server-side rendering and client-side hydration:

```typescript
// In root.tsx
export async function loader(args: LoaderFunctionArgs) {
  // ...other loader code

  // Initialize Flagship visitor data
  const fsVisitorData = {
    visitorId: 'visitorId', // In a real app, use a unique ID per user
    context: {
      key: 'value', // Add relevant context data for targeting
    },
    hasConsented: true, // This should be set based on user consent
  };

  // Fetch the Flagship visitor data
  const visitor = await getFsVisitorData(fsVisitorData);

  return {
    // ...other data
    fsInitialFlags: visitor.getFlags().toJSON(), // Serialize flags for client
    fsVisitorData, // Pass visitor data for hydration
  };
}
```

The `getFsVisitorData` function handles SDK initialization and flag fetching:

```typescript
export async function getFsVisitorData(visitorData: NewVisitor) {
  // Start the SDK in Decision Api mode and get the Flagship instance
  const flagship = await startFlagshipSDK();

  // Create a visitor
  const visitor = flagship.newVisitor(visitorData);

  // Fetch flag values for the visitor
  await visitor.fetchFlags();

  // Return visitor instance
  return visitor;
}
```

## Provide Flagship Context to Your Application

To make Flagship available throughout your application, use the `FsProvider` component to wrap your application:

```typescript
// In FsProvider.tsx
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
```

In the root Layout component, use this provider with the data from the loader:

```tsx
// In root.tsx Layout component
export function Layout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();

  const data = useRouteLoaderData<RootLoader>('root');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="stylesheet" href={tailwindCss}></link>
        <link rel="stylesheet" href={resetStyles}></link>
        <link rel="stylesheet" href={appStyles}></link>
        <Meta />
        <Links />
      </head>
      <body>
        <FsProvider
          visitorData={data?.fsVisitorData}
          initialFlagsData={data?.fsInitialFlags}
        >
          {data ? (
            <Analytics.Provider
              cart={data.cart}
              shop={data.shop}
              consent={data.consent}
            >
              <PageLayout {...data}>{children}</PageLayout>
            </Analytics.Provider>
          ) : (
            children
          )}
        </FsProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}
```

## Use Feature Flags in React Components

Once Flagship is initialized, you can use feature flags in your components with the `useFsFlag` hook:

### Example 1: Change Text Based on a Flag

```tsx
// In _index.tsx RecommendedProducts component
function RecommendedProducts({
  products,
}: {
  products: Promise<RecommendedProductsQuery | null>;
}) {
  const headingFlag = useFsFlag('recommended_products_heading');
  return (
    <div className="recommended-products">
      <h2>{headingFlag.getValue('Recommended Products')}</h2>
      {/* ... */}
    </div>
  );
}
```

### Example 2: Conditionally Display Content Based on a Flag

```tsx
// In ProductItem.tsx
export function ProductItem({
  product,
  loading,
}: {
  product:
    | CollectionItemFragment
    | ProductItemFragment
    | RecommendedProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  // ...other code

  const discountFlag = useFsFlag('show_discount_message'); // Flag for discount

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
    >
      {/* ... other content */}
      
      {discountFlag.getValue(true) && (
        <div className="discount-message">
          Special discount available!
        </div>
      )}
    </Link>
  );
}
```

## Configure Content Security Policy for Flagship

When using Flagship with Hydrogen, you need to configure the Content Security Policy (CSP) to allow connections to Flagship's domains. This is done in entry.server.tsx:

```typescript
// In entry.server.tsx
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: AppLoadContext,
) {
  const {nonce, header, NonceProvider} = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    connectSrc: ['https://*.flagship.io'], // Allow connections to Flagship domains
  });

  // ... rest of the server rendering logic
}
```

## Managing Bucketing Data

For optimal performance, Flagship uses bucketing data to make decisions locally without API calls. You can manage this data in several ways:

### Development Approach

During development, you can use a static bucketing file:

1. Fetch the bucketing data from Flagship CDN:

```bash
# Replace YOUR_ENV_ID with your Flagship Environment ID
curl -s https://cdn.flagship.io/YOUR_ENV_ID/bucketing.json > app/helpers/bucketing.json
```

2. Import it in your code:

```typescript
import initialBucketing from './bucketing.json';
```

### Production Approach

For production environments, it's better to trigger a redeployment when campaigns are updated rather than committing changes to your repository:

1. Create a GitHub Action workflow file (`.github/workflows/update-and-deploy.yml`):

```yaml
name: Update Flagship Bucketing Data and Deploy

on:
  # Webhook from Flagship when campaigns change
  repository_dispatch:
    types: [flagship-campaign-updated]
  # Allow manual triggering
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
          
      - name: Install dependencies
        run: yarn install --frozen-lockfile
      
      - name: Fetch latest bucketing data
        run: |
          curl -s https://cdn.flagship.io/${{ secrets.FLAGSHIP_ENV_ID }}/bucketing.json > app/helpers/bucketing.json
      
      - name: Build application
        run: yarn build
      
      # For Shopify Oxygen deployment
      - name: Deploy to Shopify Oxygen
        run: |
          npx shopify hydrogen deploy
        env:
          SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN: ${{ secrets.SHOPIFY_HYDROGEN_DEPLOYMENT_TOKEN }}
```

2. Set up a webhook in the Flagship Platform that triggers this workflow when campaigns are updated.
This approach:

Avoids cluttering your commit history with data changes
Provides immediate updates to production when campaigns change
Follows infrastructure-as-code best practices
Works well with modern deployment platforms like Shopify Oxygen

> ⚠️ Note: If you're using a different hosting platform, replace the deployment step with the appropriate commands for your platform (e.g., Vercel, Netlify, AWS).
>

## Learn More

* [Flagship Documentation](https://docs.developers.flagship.io/)
* [Flagship React SDK Documentation](https://docs.developers.flagship.io/docs/react-sdk)
* [Shopify Hydrogen Documentation](https://hydrogen.shopify.dev/)
* [Remix Documentation](https://remix.run/docs/en/main)
* [Feature Flag Best Practices](https://docs.developers.flagship.io/docs/feature-flag-best-practices)
