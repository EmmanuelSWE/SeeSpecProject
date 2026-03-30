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
  const init: RequestInit = {
    method,
    headers: buildProxyRequestHeaders(request),
    redirect: "manual"
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  return init;
}

export function copyResponseHeaders(source: Headers, target: Headers) {
  source.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (HOP_BY_HOP_HEADERS.has(normalizedKey)) {
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
