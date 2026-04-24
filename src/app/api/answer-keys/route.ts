import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return NextResponse.json({ error: 'Missing testId' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('answer_keys')
      .select('answers')
      .eq('testId', testId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means zero rows found
      throw error;
    }

    return NextResponse.json({ answers: data ? data.answers : null });
  } catch (error: any) {
    console.error('Fetch Answer Key Error:', error);
    return NextResponse.json({ error: 'Failed to fetch answer key' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { testId, answers } = await request.json();

    if (!testId || !answers) {
      return NextResponse.json({ error: 'Missing testId or answers' }, { status: 400 });
    }

    const { error } = await supabase
      .from('answer_keys')
      .upsert({ testId, answers, updatedAt: new Date().toISOString() }, { onConflict: 'testId' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Answer Key Error:', error);
    return NextResponse.json({ error: 'Failed to save answer key' }, { status: 500 });
  }
}
