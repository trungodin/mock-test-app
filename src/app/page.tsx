import fs from 'fs';
import path from 'path';
import styles from './page.module.css';
import TestList from '../components/TestList';

interface TestData {
  id: string;
  title: string;
  filename: string;
  questionCount: number;
  timeLimit: number;
}

async function getTests(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'tests_native.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const tests = JSON.parse(fileContents);
    return tests.map((test: any) => ({
      ...test,
      timeLimit: 60, // hardcoded time limit for now
      questionCount: 40 // fixed total items
    }));
  } catch (error) {
    console.error("Failed to load tests", error);
    return [];
  }
}

export default async function Home() {
  const tests = await getTests();

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mock Test Platform</h1>
        <p className={styles.subtitle}>Premium preparation for English Grade 10 Entrance Exam</p>
      </div>

      <TestList tests={tests} />
    </main>
  );
}
