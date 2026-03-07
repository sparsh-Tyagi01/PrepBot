import { NextRequest, NextResponse } from 'next/server';

// Judge0 CE language IDs
const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python:     71,
  java:       62,
  cpp:        54,
  go:         60,
  rust:       73,
};

export async function POST(req: NextRequest) {
  try {
    const { language, code } = await req.json();

    const language_id = LANGUAGE_IDS[language];
    if (!language_id) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // Judge0 requires base64 encoding to safely handle all source code content
    const encode = (s: string) => Buffer.from(s).toString('base64');
    const decode = (s: string | null | undefined) =>
      s ? Buffer.from(s, 'base64').toString('utf8') : '';

    const res = await fetch('https://ce.judge0.com/submissions?wait=true&base64_encoded=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id,
        source_code: encode(code ?? ''),
        stdin: encode(''),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Execution server error (${res.status}): ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Decode base64 fields before returning
    return NextResponse.json({
      ...data,
      stdout:         decode(data.stdout),
      stderr:         decode(data.stderr),
      compile_output: decode(data.compile_output),
      message:        decode(data.message),
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not reach execution server.' },
      { status: 502 }
    );
  }
}
