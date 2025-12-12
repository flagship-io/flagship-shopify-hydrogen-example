import {createHydrogenContext} from '@shopify/hydrogen';
import {AppSession} from '~/lib/session';
import {CART_QUERY_FRAGMENT} from '~/lib/fragments';
import {getFsVisitorData} from '~/helpers/flagship';
import {Flagship} from '@flagship.io/react-sdk/edge';

/**
 * The context implementation is separate from server.ts
 * so that type can be extracted for AppLoadContext
 * */
export async function createAppLoadContext(
  request: Request,
  env: Env,
  executionContext: ExecutionContext,
) {
  /**
   * Open a cache instance in the worker and a custom session instance.
   */
  if (!env?.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set');
  }

  const waitUntil = executionContext.waitUntil.bind(executionContext);
  const [cache, session] = await Promise.all([
    caches.open('hydrogen'),
    AppSession.init(request, [env.SESSION_SECRET]),
  ]);

  const hydrogenContext = createHydrogenContext({
    env,
    request,
    cache,
    waitUntil,
    session,
    i18n: {language: 'EN', country: 'US'},
    cart: {
      queryFragment: CART_QUERY_FRAGMENT,
    },
  });

  // Initialize Flagship visitor
  // Extract visitor ID from session or generate new one
  const visitorId = session.get('visitorId') || crypto.randomUUID();
  if (!session.has('visitorId')) {
    session.set('visitorId', visitorId);
  }

  const fsVisitorData = {
    visitorId,
    context: {
      // Add any context from request/session
      userAgent: request.headers.get('user-agent') as string,
      // You can add more context like:
      // country: hydrogenContext.storefront.i18n.country,
      // language: hydrogenContext.storefront.i18n.language,
    },
    hasConsented: true, // Get from cookie/session
  };

  // Fetch the Flagship visitor data
  // This will start the Flagship SDK and fetch the flags for the visitor.
  const fsVisitor = await getFsVisitorData(fsVisitorData);

  // Ensure Flagship SDK is closed after response 
  waitUntil?.(Flagship.close());

  return {
    ...hydrogenContext,
    fsVisitor, // Now available in all loaders/actions via context.fsVisitor
    // declare additional Remix loader context
  };
}
