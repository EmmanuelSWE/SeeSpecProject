import { type NextRequest } from "next/server";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

function getBackendBaseUrl() {
  const baseUrl = process.env.BACKEND_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("BACKEND_API_BASE_URL is not configured.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function shouldAllowInsecureLocalDevTls(backendUrl: URL) {
  return (
    process.env.NODE_ENV === "development" &&
    backendUrl.protocol === "https:" &&
    (backendUrl.hostname === "localhost" || backendUrl.hostname === "127.0.0.1")
  );
}

export function buildBackendUrl(request: NextRequest, path: string[]) {
  const pathname = path.join("/");
  const backendUrl = new URL(`${getBackendBaseUrl()}/api/${pathname}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  return backendUrl;
}

export function buildProxyRequestHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
      return;
    }

    headers.set(key, value);
  });

  headers.set("x-forwarded-host", request.headers.get("host") ?? "");
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

export async function buildProxyRequestInit(request: NextRequest): Promise<RequestInit> {
  const method = request.method.toUpperCase();
  const backendUrl = new URL(getBackendBaseUrl());
  const init: RequestInit = {
    method,
    headers: buildProxyRequestHeaders(request),
    redirect: "manual"
  };

  if (shouldAllowInsecureLocalDevTls(backendUrl)) {
    // Local ASP.NET development commonly uses a self-signed certificate. Restrict the TLS
    // bypass to localhost in development so deployed environments still require valid certs.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  return init;
}

export function copyResponseHeaders(source: Headers, target: Headers) {
  source.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (
      HOP_BY_HOP_HEADERS.has(normalizedKey) ||
      normalizedKey === "content-encoding"
    ) {
      return;
    }

    if (normalizedKey === "set-cookie") {
      return;
    }

    target.append(key, value);
  });

  const getSetCookie = (source as Headers & { getSetCookie?: () => string[] }).getSetCookie;

  if (typeof getSetCookie === "function") {
    for (const cookie of getSetCookie.call(source)) {
      target.append("set-cookie", cookie);
    }

    return;
  }

  const singleCookie = source.get("set-cookie");
  if (singleCookie) {
    target.append("set-cookie", singleCookie);
  }
}
