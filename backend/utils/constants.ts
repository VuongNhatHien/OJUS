export const STATUS_CODE = {
  SUCCESS: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

export const verdict = {
  OK: "OK",
  WRONG_ANSWER: "WRONG_ANSWER",
  TIME_LIMIT_EXCEEDED: "TIME_LIMIT_EXCEEDED",
  RUNTIME_ERROR: "RUNTIME_ERROR",
  COMPILE_ERROR: "COMPILE_ERROR",
};

export const DO_bucket = "ojus-bucket";
export const DO_endpoint = "https://sgp1.digitaloceanspaces.com";
export const DO_region = "sgp1";
export const DO_location =
  "https://ojus-bucket.sgp1.cdn.digitaloceanspaces.com";
