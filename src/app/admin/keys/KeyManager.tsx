'use client';

import React, { useState, useEffect } from 'react';

export default function KeyManager({ tests }: { tests: any[] }) {
  const [selectedTestId, setSelectedTestId] = useState<string>(tests[0]?.id || '');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const selectedTest = tests.find(t => t.id === selectedTestId);

  // Extract all scorable keys for the current test
  const getScorableItems = () => {
    if (!selectedTest) return [];
    const items: { id: string, label: string, isText: boolean, isTF: boolean }[] = [];
    
    const isOldTest = !selectedTest.id.toString().startsWith("new_test_");
    
    selectedTest.questions.forEach((q: any) => {
      const isTextMode = isOldTest ? (parseInt(q.id) >= 24 && parseInt(q.id) <= 34 && q.id !== "30") : (q.type === "text");
      const isTF = q.type === "true_false";
      
      if (q.id === "17" && isOldTest) {
        for(let i=1; i<=6; i++) {
           items.push({ id: `17.${i}`, label: `Câu 17.${i}`, isText: false, isTF: false });
        }
      } else if (q.id === "30" && isOldTest) {
        for(let i=1; i<=2; i++) {
           items.push({ id: `30.${i}`, label: `Câu 30.${i}`, isText: true, isTF: false });
        }
      } else {
         items.push({ id: q.id, label: `Câu ${q.id}`, isText: isTextMode, isTF });
      }
    });
    return items;
  };

  const scorableItems = getScorableItems();

  useEffect(() => {
    if (!selectedTestId) return;
    
    const fetchKeys = async () => {
      setIsLoading(true);
      setMessage({ type: '', text: '' });
      try {
        const res = await fetch(`/api/answer-keys?testId=${selectedTestId}`);
        const data = await res.json();
        if (data.answers) {
          setAnswers(data.answers);
          setMessage({ type: 'success', text: 'Đã tải đáp án hiện tại.' });
        } else {
          setAnswers({});
          setMessage({ type: 'info', text: 'Đề này chưa có đáp án chuẩn. Vui lòng nhập mới.' });
        }
      } catch (err) {
        setAnswers({});
        setMessage({ type: 'error', text: 'Lỗi tải đáp án.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchKeys();
  }, [selectedTestId]);

  const handleChange = (id: string, val: string) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
    setMessage({ type: '', text: '' }); // Clear message on change
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/answer-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: selectedTestId, answers })
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã lưu đáp án thành công!' });
      } else {
        setMessage({ type: 'error', text: 'Lỗi khi lưu đáp án.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu đáp án.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ fontWeight: 'bold' }}>Chọn Đề Thi:</label>
        <select 
          value={selectedTestId} 
          onChange={(e) => setSelectedTestId(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '300px' }}
        >
          {tests.map(t => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        
        {message.text && (
          <span style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            fontSize: '0.9rem',
            backgroundColor: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0e7ff',
            color: message.type === 'success' ? '#166534' : message.type === 'error' ? '#991b1b' : '#3730a3'
          }}>
            {message.text}
          </span>
        )}
      </div>

      {isLoading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {scorableItems.map(item => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontWeight: '600', color: '#4b5563', fontSize: '0.9rem' }}>{item.label}</label>
                {item.isText ? (
                  <textarea 
                    value={answers[item.id] || ''}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                    placeholder="Ngăn cách bằng dấu / hoặc xuống dòng"
                    rows={2}
                    style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {(item.isTF ? ['True', 'False'] : ['A', 'B', 'C', 'D']).map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleChange(item.id, opt)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 0',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          background: answers[item.id] === opt ? '#4f46e5' : '#fff',
                          color: answers[item.id] === opt ? '#fff' : '#374151',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s'
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{
              padding: '0.75rem 2rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1
            }}
          >
            {isSaving ? 'Đang lưu...' : 'Lưu Đáp Án Chuẩn'}
          </button>
        </div>
      )}
    </div>
  );
}
