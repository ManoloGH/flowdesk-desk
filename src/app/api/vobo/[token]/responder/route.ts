import { NextRequest, NextResponse } from 'next/server';

const SOC_UPSTREAM =
  process.env.SOC_API_URL ?? 'https://soc-requirements-production.up.railway.app';

// POST /api/vobo/{token}/responder  →  proxy to SOC (public, no JWT)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.text();
  const res = await fetch(`${SOC_UPSTREAM}/api/vobo/${token}/responder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
