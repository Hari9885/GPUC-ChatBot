import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const candidates = [
      path.join(process.cwd(), 'src', 'gpuc-north.html'),
      path.join(process.cwd(), 'public', 'gpuc-north.html'),
      path.join(process.cwd(), 'gpuc-north.html'),
    ];

    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const html = fs.readFileSync(filePath, 'utf-8');
        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          },
        });
      }
    }
  } catch (err) {
    console.error('Error reading gpuc-north.html:', err);
  }

  return NextResponse.redirect(new URL('/embed', req.url));
}
