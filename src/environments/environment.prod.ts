/** Used when building with --configuration=production (see angular.json fileReplacements). */
export const environment = {
  production: true,
  /** Empty string = same origin; nginx / ingress reverse-proxies /api, /auth, /uploads to the backend. */
  apiUrl: 'https://campconnect-pi-d9emffg5dba8eqe9.southafricanorth-01.azurewebsites.net',
  allowOfflineAuth: false
};
