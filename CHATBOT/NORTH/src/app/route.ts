import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'gpuc-north.html');
    if (fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, 'utf-8');
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
  } catch (err) {
    console.error('Error reading gpuc-north.html:', err);
  }

  return NextResponse.redirect(new URL('/embed', req.url));
}
