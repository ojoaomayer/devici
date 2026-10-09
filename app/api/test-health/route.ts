import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, time: new Date().toISOString() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({ ok: true, received: body });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error' }, { status: 500 });
  }
}
