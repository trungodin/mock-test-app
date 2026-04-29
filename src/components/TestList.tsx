'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './TestList.module.css';

interface TestData {
  id: string;
  title: string;
  filename: string;
  questionCount: number;
  timeLimit: number;
}

interface Props {
  tests: TestData[];
}

export default function TestList({ tests }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tests based on search query
  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests;
    
    const query = searchQuery.toLowerCase().trim();
    return tests.filter(test => {
      // Allow searching by exact ID number if user types "43"
      const numberMatch = test.title.match(/\d+/);
      const testNumber = numberMatch ? numberMatch[0] : '';
      
      return test.title.toLowerCase().includes(query) || 
             testNumber === query;
    });
  }, [tests, searchQuery]);

  // Handle direct selection from dropdown
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (selectedId) {
      router.push(`/test/${selectedId}`);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Search and Filter Controls */}
      <div className={styles.filterContainer}>
        
        {/* Search Bar */}
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm theo tên đề (vd: 43, Thực hành 1)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dropdown and Results Count */}
        <div className={styles.controlsRow}>
          <div className={styles.resultsCount}>
            Hiển thị <strong>{filteredTests.length}</strong> / {tests.length} đề thi
          </div>
          
          <div className={styles.selectWrapper}>
            <select className={styles.testSelect} onChange={handleSelectChange} defaultValue="">
              <option value="" disabled>-- Chọn đề thả xuống --</option>
              {filteredTests.map((test) => (
                <option key={`select-${test.id}`} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
            <svg className={styles.selectIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {filteredTests.length > 0 ? (
        <div className={styles.grid}>
          {filteredTests.map((test) => (
            <Link href={`/test/${test.id}`} key={test.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{test.title}</h2>
                {test.id.startsWith("new_test") ? (
                  <span className={styles.badge}>Mới</span>
                ) : (
                  <span className={styles.badgeOld}>Cũ</span>
                )}
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
      ) : (
        <div className={styles.noResults}>
          <h3>Không tìm thấy đề thi nào!</h3>
          <p>Thử tìm với một từ khóa khác nhé (ví dụ: gõ "1" thay vì "Đề 1").</p>
        </div>
      )}
    </div>
  );
}
