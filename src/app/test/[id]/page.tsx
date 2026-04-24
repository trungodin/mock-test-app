import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import TestSession from '@/components/TestSession';

interface TestData {
  id: string;
  title: string;
  filename: string;
  questions: any[];
  timeLimit?: number;
  questionCount?: number;
}

async function getTest(id: string): Promise<TestData | null> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'tests_native.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const tests: TestData[] = JSON.parse(fileContents);
    const found = tests.find(t => t.id === id);
    if (found) {
       return {
         ...found,
         timeLimit: 60,
         questionCount: 40
       };
    }
    return null;
  } catch (error) {
    console.error("Failed to load test", error);
    return null;
  }
}

// Generate static params for all tests to ensure they are pre-rendered
export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'public', 'data', 'tests_native.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const tests: TestData[] = JSON.parse(fileContents);
    return tests.map((test) => ({
      id: test.id,
    }));
  } catch (error) {
    return [];
  }
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await getTest(id);

  if (!test) {
    notFound();
  }

  return <TestSession test={test} />;
}
