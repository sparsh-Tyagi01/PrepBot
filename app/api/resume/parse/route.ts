import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/resume/parse — accepts multipart/form-data with a 'file' field
// Returns { text: string } with the extracted plain text from the resume
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain'];
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (!allowedTypes.includes(fileType) && !fileName.endsWith('.pdf') && !fileName.endsWith('.txt')) {
      return NextResponse.json(
        { error: 'Only PDF and plain text files are supported' },
        { status: 400 }
      );
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else {
      // PDF — use pdfjs-dist (already in the dependency tree) to extract text server-side
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      // Disable the worker for server-side parsing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfjs as any).GlobalWorkerOptions = { workerSrc: '' };
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const doc = await loadingTask.promise;
      const pages: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pageText = content.items.map((item: any) => item.str ?? '').join(' ');
        pages.push(pageText);
      }
      text = pages.join('\n');
    }

    // Trim excessive whitespace
    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!text) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 422 });
    }

    // Cap at 8000 chars to keep within token limits
    if (text.length > 8000) {
      text = text.slice(0, 8000) + '\n[Resume truncated for length]';
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error('[Resume Parse] Error:', error);
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 });
  }
}
