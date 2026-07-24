declare module "@medusajs/js-sdk" {
  export class FetchError extends Error {
    statusText?: string;
    status?: number;
  }
}
