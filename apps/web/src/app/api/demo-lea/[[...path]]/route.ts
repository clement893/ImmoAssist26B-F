/**
 * Proxy for LEA demo mode: forwards requests to the backend with X-LEA-Demo-Token.
 * Allows the public demo page to use Léa as clement@nukleo.com without login.
 * LEA_DEMO_TOKEN must match the backend env (server-only, not exposed to client).
 */

import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
    'http://localhost:8000';
  return url.trim().replace(/\/$/, '');
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const demoToken = process.env.LEA_DEMO_TOKEN;
  if (!demoToken) {
    return NextResponse.json(
      { detail: 'LEA demo is not configured' },
      { status: 503 }
    );
  }
  const pathStr = path?.length ? path.join('/') : '';
  const backendUrl = `${getBackendUrl()}/api/v1/lea/${pathStr}`;
  const url = new URL(backendUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-LEA-Demo-Token': demoToken,
        Accept: 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { detail: 'Backend unavailable' },
      { status: 502 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const demoToken = process.env.LEA_DEMO_TOKEN;
  if (!demoToken) {
    return NextResponse.json(
      { detail: 'LEA demo is not configured' },
      { status: 503 }
    );
  }
  const pathStr = path?.length ? path.join('/') : '';
  const backendUrl = `${getBackendUrl()}/api/v1/lea/${pathStr}`;
  const contentType = request.headers.get('content-type') || '';

  if (pathStr === 'chat/stream') {
    // Stream response: pipe backend SSE to client
    try {
      const body = await request.text();
      const backendRes = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-LEA-Demo-Token': demoToken,
          Accept: 'text/event-stream',
        },
        body: body || undefined,
      });
      if (!backendRes.ok) {
        const err = await backendRes.text();
        return NextResponse.json(
          { detail: err || 'Stream request failed' },
          { status: backendRes.status }
        );
      }
      return new NextResponse(backendRes.body, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } catch (e) {
      return NextResponse.json(
        { detail: 'Backend unavailable' },
        { status: 502 }
      );
    }
  }

  if (contentType.includes('multipart/form-data')) {
    // Voice: forward FormData
    const formData = await request.formData();
    try {
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'X-LEA-Demo-Token': demoToken,
        },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    } catch (e) {
      return NextResponse.json(
        { detail: 'Backend unavailable' },
        { status: 502 }
      );
    }
  }

  // JSON body
  const body = await request.text();
  try {
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LEA-Demo-Token': demoToken,
        Accept: 'application/json',
      },
      body: body || undefined,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { detail: 'Backend unavailable' },
      { status: 502 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await context.params;
  const demoToken = process.env.LEA_DEMO_TOKEN;
  if (!demoToken) {
    return NextResponse.json(
      { detail: 'LEA demo is not configured' },
      { status: 503 }
    );
  }
  const pathStr = path?.length ? path.join('/') : '';
  const backendUrl = `${getBackendUrl()}/api/v1/lea/${pathStr}`;
  const url = new URL(backendUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  try {
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        'X-LEA-Demo-Token': demoToken,
        Accept: 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json(
      { detail: 'Backend unavailable' },
      { status: 502 }
    );
  }
}
