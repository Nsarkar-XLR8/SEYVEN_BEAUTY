import { NextResponse } from 'next/server';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';

  try {
    const res = await fetch(`${backendUrl}/catalog/categories`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(Array.isArray(data) ? data : []);
    }
  } catch (err: any) {
    console.error('[Catalog Categories API Backend Fetch Notice]', err?.message);
  }

  return NextResponse.json([]);
}
