import {HydratedRouter} from 'react-router/dom';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
// import {FsProvider} from './helpers/FsProvider';

if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        {/* <FsProvider> */}
          <HydratedRouter />
        {/* </FsProvider> */}
      </StrictMode>,
    );
  });
}
