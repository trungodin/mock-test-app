import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import KeyManager from './KeyManager';

export const metadata = {
  title: 'Quản lý Đáp Án',
};

export default async function AdminKeysPage() {
  // Load tests from JSON
  const filePath = path.join(process.cwd(), 'public', 'data', 'tests_native.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const tests = JSON.parse(fileContents);

  // We only need basic structure to pass to client
  const testsSummary = tests.map((t: any) => ({
    id: t.id,
    title: t.title,
    questions: t.questions.map((q: any) => ({
      id: q.id,
      type: q.type,
      subQuestions: q.subQuestions || []
    }))
  }));

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #eaeaea' }}>
        <div>
          <h1 style={{ margin: 0, color: '#333' }}>Quản lý Đáp Án Chuẩn</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>Cập nhật đáp án đúng cho từng bài thi để hệ thống chấm điểm chính xác.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin" style={{ padding: '0.5rem 1rem', background: '#f5f5f5', color: '#333', textDecoration: 'none', borderRadius: '6px', fontWeight: '500' }}>
            Xem Điểm Học Sinh
          </Link>
          <Link href="/" style={{ padding: '0.5rem 1rem', background: '#e0e7ff', color: '#4f46e5', textDecoration: 'none', borderRadius: '6px', fontWeight: '500' }}>
            Trang Chủ
          </Link>
        </div>
      </header>

      <KeyManager tests={testsSummary} />
    </div>
  );
}
