import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cleanSlug = (slug || '').replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  try {
    const res = await fetch(`${backendUrl}/catalog/products/${cleanSlug}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data) {
        return NextResponse.json(data);
      }
    }
  } catch (err: any) {
    console.error('[Catalog Product Slug API Notice]', err?.message);
  }

  return NextResponse.json({ error: 'Product not found' }, { status: 404 });
}
