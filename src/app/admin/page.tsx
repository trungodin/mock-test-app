import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getSubmissions() {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('submittedAt', { ascending: false });

  if (error) {
    console.error("Failed to read submissions from Supabase", error);
    return [];
  }
  return data || [];
}

export default async function AdminDashboard() {
  const submissions = await getSubmissions();
  
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: '#f8fafc', fontFamily: 'sans-serif' }}>
       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
             <div>
                <h1 style={{ fontSize: '2rem', color: '#0f172a', margin: 0 }}>Bảng Theo Dõi Điểm Học Sinh</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#10b981', fontWeight: 'bold' }}>● Đã kết nối Supabase Cloud Database</p>
             </div>
             <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#0f172a', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
                Quay lại Trang chủ
             </Link>
          </header>

          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', overflow: 'hidden' }}>
             {submissions.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                   Chưa có học sinh nào nộp bài.
                </div>
             ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                   <thead>
                      <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>Ngày nộp</th>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>Học sinh</th>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>Đề làm bài</th>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>Thời gian</th>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>Điểm trắc nghiệm</th>
                         <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                   </thead>
                   <tbody>
                      {submissions.map((sub: any) => (
                         <tr key={sub.id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }}>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#64748b' }}>
                               {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', fontWeight: 'bold', color: '#0f172a' }}>
                               {sub.studentName}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a' }}>
                               {sub.testTitle}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', color: '#0f172a' }}>
                               {formatTime(sub.timeTaken)}
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem' }}>
                               <span style={{ 
                                  background: sub.score >= 5 ? '#d1fae5' : '#fee2e2', 
                                  color: sub.score >= 5 ? '#064e3b' : '#991b1b', 
                                  padding: '0.25rem 0.75rem', 
                                  borderRadius: '999px',
                                  fontWeight: 'bold'
                               }}>
                                  {sub.score} / 10
                               </span>
                            </td>
                            <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                               <button 
                                  style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600', opacity: 0.5 }}
                                  title={`Chức năng xem chi tiết đang được hoàn thiện.`}
                               >
                                  Chấm tự luận
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             )}
          </div>
       </div>
    </div>
  );
}
