import { NextRequest, NextResponse } from 'next/server';

const SOC_UPSTREAM =
  process.env.SOC_API_URL ?? 'https://soc-requirements-production.up.railway.app';

// This secret must match Jwt__Secret in the SOC Railway service.
const SOC_JWT_SECRET =
  process.env.SOC_JWT_SECRET ?? 'flowdesk_jwt_secret_2026_mentoria_systems_prod';

/** Decode the FlowDesk JWT payload without verifying the signature. */
function extractTenantId(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = Buffer.from(part, 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    return payload.tenantId ?? payload.tenant_id ?? null;
  } catch {
    return null;
  }
}

/** Sign a minimal HS256 JWT for the SOC API. */
async function makeSocToken(tenantId: string): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ sub: 'fd-proxy', tenantId, exp: Math.floor(Date.now() / 1000) + 300 })
  ).toString('base64url');
  const toSign = `${header}.${payload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SOC_JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const rawSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(toSign));
  const sig = Buffer.from(rawSig).toString('base64url');

  return `${toSign}.${sig}`;
}

async function proxy(req: NextRequest, pathParts: string[]): Promise<NextResponse> {
  const fdToken = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  let tenantId = extractTenantId(fdToken);

  // En desarrollo sin token real → usar tenant de prueba configurado en .env.local
  if (!tenantId) {
    const devTenant = process.env.SOC_DEV_TENANT_ID;
    if (process.env.NODE_ENV !== 'production' && devTenant) {
      tenantId = devTenant;
    } else {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
  }

  const socToken = await makeSocToken(tenantId);
  const upstreamUrl = `${SOC_UPSTREAM}/${pathParts.join('/')}${req.nextUrl.search}`;

  const method = req.method;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method);
  const body = hasBody ? await req.text() : undefined;

  const upstream = await fetch(upstreamUrl, {
    method,
    headers: {
      Authorization: `Bearer ${socToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  // 204 / 205 — no body
  if (upstream.status === 204 || upstream.status === 205) {
    return new NextResponse(null, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  }

  // Binary responses (e.g. Word download)
  const bytes = await upstream.arrayBuffer();
  return new NextResponse(bytes, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': upstream.headers.get('content-disposition') ?? '',
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxy(req, path);
}
