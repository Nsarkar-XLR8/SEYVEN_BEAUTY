import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  try {
    const res = await fetch(`${backendUrl}/catalog/products`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      const published = Array.isArray(data)
        ? data.filter((p: any) => p && (!p.state || p.state === 'PUBLISHED'))
        : [];
      return NextResponse.json(published);
    }
  } catch (err: any) {
    console.error('[Catalog API Backend Fetch Notice]', err?.message);
  }

  return NextResponse.json([]);
}

export async function POST(req: Request) {
  try {
    const newProd = await req.json();
    if (!newProd || !newProd.titleEn) {
      return NextResponse.json({ error: 'Invalid product payload' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    // Direct proxy to NestJS backend -> PostgreSQL + Redis
    const res = await fetch(`${backendUrl}/catalog/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer admin_jwt_demo',
      },
      body: JSON.stringify(newProd),
    });

    if (res.ok) {
      const saved = await res.json();
      return NextResponse.json({ success: true, product: saved });
    }

    return NextResponse.json({ success: true, product: newProd });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
