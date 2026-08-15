import { NextRequest, NextResponse } from 'next/server';

const SOC_UPSTREAM =
  process.env.SOC_API_URL ?? 'https://soc-requirements-production.up.railway.app';

// GET /api/vobo/{token}  →  proxy to SOC (public, no JWT)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const res = await fetch(`${SOC_UPSTREAM}/api/vobo/${token}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
