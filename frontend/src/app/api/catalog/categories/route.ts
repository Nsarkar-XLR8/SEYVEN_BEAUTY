import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://seyven-beauty-backend.onrender.com/api/v1';
  const { searchParams } = new URL(req.url);
  const flat = searchParams.get('flat');
  const targetUrl = flat ? `${backendUrl}/catalog/categories?flat=${flat}` : `${backendUrl}/catalog/categories`;

  try {
    const res = await fetch(targetUrl, {
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
