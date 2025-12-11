import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, type MetaFunction} from 'react-router';
import {Suspense} from 'react';
import {Image, Money} from '@shopify/hydrogen';
import type {
  FeaturedCollectionFragment,
  RecommendedProductsQuery,
} from 'storefrontapi.generated';
import {ProductItem} from '~/components/ProductItem';
import {
  EventCategory,
  Flagship,
  HitType,
  useFsFlag,
} from '@flagship.io/react-sdk/edge';

export const meta: MetaFunction = () => {
  return [{title: 'Hydrogen | Home'}];
};

export async function loader(args: LoaderFunctionArgs) {
  const {context, request} = args;

  // Access the visitor from context
  const {fsVisitor, waitUntil} = context;

  // Get flag value to control number of products fetched
  const productCountFlag = fsVisitor.getFlag('recommended_products_count');
  const productCount = productCountFlag.getValue(4); // Default to 4

  // Get flag to determine sorting strategy
  const sortingFlag = fsVisitor.getFlag('product_sorting_strategy');
  const sortBy = sortingFlag.getValue('UPDATED_AT');

  // Add hits to the pool (non-blocking, no await needed but can be used)
  // Hits will be sent when Flagship.close() is called in context.ts
  // Continue with data loading immediately
  await fsVisitor.sendHits([
    {
      type: HitType.PAGE_VIEW,
      documentLocation: request.url,
    },
    {
      type: HitType.EVENT,
      category: EventCategory.ACTION_TRACKING,
      action: 'checkout_version_view',
      label: 'new_checkout_flow',
      value: 1,
    },
  ]);

  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);

  return {
    ...deferredData,
    ...criticalData,
    productCount,
    sortBy,
  };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({context}: LoaderFunctionArgs) {
  const [{collections}] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {
    featuredCollection: collections.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

export default function Homepage() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="home">
      <FeaturedCollection collection={data.featuredCollection} />
      <RecommendedProducts
        products={data.recommendedProducts}
        count={data.productCount}
      />
    </div>
  );
}

function FeaturedCollection({
  collection,
}: {
  collection: FeaturedCollectionFragment;
}) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

function RecommendedProducts({
  products,
  count,
}: {
  products: Promise<RecommendedProductsQuery | null>;
  count?: number;
}) {
  const headingFlag = useFsFlag('recommended_products_heading');
  return (
    <div className="recommended-products">
      <h2>{headingFlag.getValue('Recommended Products')}</h2>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes
                    .slice(0, count || 4)
                    .map((product) => (
                      <ProductItem key={product.id} product={product} />
                    ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
` as const;
