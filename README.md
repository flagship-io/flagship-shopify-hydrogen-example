# Flagship + Shopify Hydrogen Integration Example

A complete example demonstrating how to integrate [Flagship](https://www.flagship.io/) feature flags with [Shopify Hydrogen](https://hydrogen.shopify.dev/), Shopify's React-based framework for building custom storefronts.

## 🚀 Features

- ✅ **Edge-optimized bucketing** - Lightning-fast flag decisions without API calls
- ✅ **Server-side rendering** - Feature flags work seamlessly with SSR
- ✅ **Client-side hydration** - Smooth transition from server to client
- ✅ **Analytics pooling** - Efficient batch sending of analytics data
- ✅ **Session persistence** - Visitor IDs persist across requests
- ✅ **TypeScript support** - Full type safety throughout

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Shopify store](https://www.shopify.com/) with Storefront API access
- A [Flagship account](https://app.flagship.io/login) with Environment ID and API Key

## 🛠️ Installation

1. **Clone the repository:**

```bash
git clone https://github.com/flagship-io/flagship-hydrogen-example
cd flagship-hydrogen-example
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory:

```bash
# Flagship Configuration
VITE_ENV_ID=your_flagship_environment_id
VITE_API_KEY=your_flagship_api_key

# Shopify Configuration
PUBLIC_STOREFRONT_API_TOKEN=your_storefront_api_token
PUBLIC_STORE_DOMAIN=your-store.myshopify.com
SESSION_SECRET=your_session_secret
```

4. **Fetch initial bucketing data:**

```bash
curl -s https://cdn.flagship.io/YOUR_ENV_ID/bucketing.json > app/helpers/bucketing.json
```

Replace `YOUR_ENV_ID` with your actual Flagship Environment ID.

## 🏃 Running the Project

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

### Deploy to Shopify Oxygen

```bash
npx shopify hydrogen deploy
```

## 📖 Learn More

### Flagship Resources

- [Edge Bucketing Guide](https://docs.developers.flagship.io/docs/bucketing)
