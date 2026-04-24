import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Insert into Supabase
    const { data: insertedData, error } = await supabase
      .from('submissions')
      .insert([
        {
          studentName: data.studentName,
          testId: data.testId,
          testTitle: data.testTitle,
          score: data.score,
          timeTaken: data.timeTaken,
          answers: data.answers
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Submission saved successfully', data: insertedData }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to save submission:', error);
    return NextResponse.json({ success: false, message: error.message || 'Unknown error' }, { status: 500 });
  }
}
