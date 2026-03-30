import { type NextRequest } from "next/server";
import {
  buildBackendUrl,
  buildProxyRequestInit,
  copyResponseHeaders
} from "@/app/lib/api/bff-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxyRequest(request: NextRequest, path: string[]) {
  const targetUrl = buildBackendUrl(request, path);
  const upstreamResponse = await fetch(targetUrl, await buildProxyRequestInit(request));

  const responseHeaders = new Headers();
  copyResponseHeaders(upstreamResponse.headers, responseHeaders);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

