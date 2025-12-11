import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {
  ProductItemFragment,
  CollectionItemFragment,
  RecommendedProductFragment,
} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';
import {
  EventCategory,
  HitType,
  useFlagship,
  useFsFlag,
} from '@flagship.io/react-sdk/edge';

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
  const variantUrl = useVariantUrl(product.handle);
  const image = product.featuredImage;
  // Get flag to control discount message visibility
  const discountFlag = useFsFlag('show_discount_message');
  const showDiscount = discountFlag.getValue(false);
  const flagship = useFlagship();

  const handleProductClick = async () => {
    // Send hit - it will be pooled and sent in batch in the background
    flagship.sendHits([
      {
        type: HitType.EVENT,
        category: EventCategory.ACTION_TRACKING,
        action: 'product_click',
        label: product.title,
        value: 1,
      },
    ]);
  };

  return (
    <Link
      className="product-item"
      key={product.id}
      prefetch="intent"
      to={variantUrl}
      onClick={handleProductClick}
    >
      {image && (
        <Image
          alt={image.altText || product.title}
          aspectRatio="1/1"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h4>{product.title}</h4>
      <small>
        <Money data={product.priceRange.minVariantPrice} />
      </small>
      {/* Conditionally render discount message based on flag */}
      {showDiscount && (
        <div className="discount-message">Special discount available!</div>
      )}
    </Link>
  );
}
