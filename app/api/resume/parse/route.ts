import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PDFParse } from 'pdf-parse';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

// Configure the pdfjs worker once at module load (Node.js server-side)
const workerPath = resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
PDFParse.setWorker(pathToFileURL(workerPath).toString());

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
      // PDF — use pdf-parse for server-side text extraction
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      text = result.text;
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
