import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { word } = await request.json();

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    // Clean the word
    const cleanWord = word.trim().toLowerCase();

    // Fetch from MyMemory free API
    const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanWord)}&langpair=en|vi`);
    const data = await res.json();

    if (data && data.responseData && data.responseData.translatedText) {
      return NextResponse.json({ translation: data.responseData.translatedText });
    }

    return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
