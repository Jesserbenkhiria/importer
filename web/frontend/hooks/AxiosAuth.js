import axios from 'axios';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import { authenticatedFetch } from '@shopify/app-bridge-utils';

/**
 * A hook that returns an auth-aware Axios instance.
 * @desc The returned Axios instance is configured to:
 *
 * 1. Add a `X-Shopify-Access-Token` header to the request.
 * 2. Check response for `X-Shopify-API-Request-Failure-Reauthorize` header.
 * 3. Redirect the user to the reauthorization URL if the header is present.
 *
 * @returns {Object} Axios instance
 */
export function useAuthenticatedAxios() {
  const app = useAppBridge();

  // Create an Axios instance
  const axiosInstance = axios.create();

  // Add request interceptor to include the access token
  axiosInstance.interceptors.request.use(
    async (config) => {
      const fetchFunction = authenticatedFetch(app);
      const tokenResponse = await fetchFunction('/api/auth/token', { method: 'GET' });
      const tokenData = await tokenResponse.json();

      config.headers['X-Shopify-Access-Token'] = tokenData.accessToken; // Adjust if token is in a different format
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Add response interceptor to handle reauthorization headers
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const headers = error.response?.headers;
      if (headers && headers['x-shopify-api-request-failure-reauthorize'] === '1') {
        const authUrlHeader =
          headers['x-shopify-api-request-failure-reauthorize-url'] || '/api/auth';

        const redirect = Redirect.create(app);
        redirect.dispatch(
          Redirect.Action.REMOTE,
          authUrlHeader.startsWith('/')
            ? `https://${window.location.host}${authUrlHeader}`
            : authUrlHeader
        );
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}
