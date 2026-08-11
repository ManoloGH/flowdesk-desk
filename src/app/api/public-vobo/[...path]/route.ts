import { NextRequest, NextResponse } from 'next/server';

const SOC_UPSTREAM =
  process.env.SOC_API_URL ?? 'https://soc-requirements-production.up.railway.app';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const upstream = await fetch(
    `${SOC_UPSTREAM}/api/vobo/${path.join('/')}${req.nextUrl.search}`
  );
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const body = await req.text();
  const upstream = await fetch(
    `${SOC_UPSTREAM}/api/vobo/${path.join('/')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  );
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
