import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import styles from './page.module.css';

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

      <div className={styles.grid}>
        {tests.map((test) => (
          <Link href={`/test/${test.id}`} key={test.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{test.title}</h2>
              <span className={styles.badge}>Mới</span>
            </div>
            
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {test.timeLimit} Phút
              </div>
              <div className={styles.metaItem}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                {test.questionCount} Câu hỏi
              </div>
            </div>

            <div className={styles.cardAction}>
              Bắt đầu làm bài
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
