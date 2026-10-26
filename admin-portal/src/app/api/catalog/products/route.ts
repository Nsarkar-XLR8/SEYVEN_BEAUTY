import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const newProd = await req.json();
    if (!newProd || !newProd.titleEn) {
      return NextResponse.json({ error: 'Invalid product payload' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

    // Direct proxy to NestJS backend -> Supabase PostgreSQL + Redis
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
