"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './TestSession.module.css';

interface TestSessionProps {
  test: any;
}

export default function TestSession({ test }: TestSessionProps) {
  // Onboarding state
  const [studentName, setStudentName] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isStarted || isSubmitted || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted, isStarted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qId: string, option: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleTextAnswer = (qId: string, text: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: text,
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    
    // In the new JSON, we don't have perfect answers for everything if they were mocked.
    // We will just do a basic score calculation based on what we have.
    let correctCount = 0;
    let totalScoreable = 40; // Hardcoded 40 items

    // Calculate...
    test.questions.forEach((q: any) => {
       if (q.id === "17") {
          for(let i=1; i<=6; i++) {
             const key = `17.${i}`;
             if (userAnswers[key]) correctCount++; // naive mock
          }
       } else if (q.id === "30") {
          for(let i=1; i<=2; i++) {
             const key = `30.${i}`;
             if (userAnswers[key]) correctCount++;
          }
       } else {
          const ans = userAnswers[q.id];
          if (ans && ans.toLowerCase() === (q.answer || "").toLowerCase()) {
              correctCount++;
          }
       }
    });

    const finalScore = Number(((correctCount / totalScoreable) * 10).toFixed(2));
    
    // Prepare payload
    const payload = {
      studentName,
      testId: test.id,
      testTitle: test.title,
      score: finalScore,
      timeTaken: (test.timeLimit * 60) - timeLeft,
      answers: userAnswers
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
         console.error('Submission failed');
      }
    } catch (err) {
      console.error('API Error', err);
    }

    setScore(finalScore);
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const handleRetry = () => {
    setUserAnswers({});
    setTimeLeft(test.timeLimit * 60);
    setIsSubmitted(false);
    setScore(0);
    setIsStarted(false);
    setStudentName('');
  };

  // Helper to render question blocks
  const renderQuestionBlock = (q: any) => {
    // Determine if it needs text input
    const isTextMode = parseInt(q.id) >= 24 && parseInt(q.id) <= 34 && q.id !== "30";
    const isMultipleBlanks = q.id === "17" || q.id === "30";

    let displayPrompt = q.prompt;
    let extraPassage = null;

    if (q.id === "16") {
      displayPrompt = displayPrompt.replace(/Q17\.\d+\.?\n?/g, '').trim();
    }
    if (q.id === "17") {
      // The parser often lumps the reading passage for Q18-23 into Q17.
      const splitStr = "Read and do the following tasks.";
      const splitIdx = displayPrompt.indexOf(splitStr);
      if (splitIdx !== -1) {
        extraPassage = displayPrompt.substring(splitIdx).trim();
        displayPrompt = displayPrompt.substring(0, splitIdx).trim();
      }
    }
    if (q.id === "34") {
      const cutIdx = displayPrompt.indexOf("Question 1.");
      if (cutIdx !== -1) {
        displayPrompt = displayPrompt.substring(0, cutIdx).trim();
      }
    }

    return (
      <React.Fragment key={q.id}>
      <div id={`question-${q.id}`} className={styles.questionCard}>
        <div className={styles.questionLabel}>Question {q.id}</div>
        <div className={styles.prompt}>{displayPrompt}</div>
        
        {/* If it's a standard MCQ */}
        {q.type === "mcq" && !isMultipleBlanks && !isTextMode && (
          <div className={styles.optionsContainer}>
            {Object.entries(q.options || {}).map(([key, val]) => {
               const isSelected = userAnswers[q.id] === key;
               const isCorrect = isSubmitted && q.answer === key;
               const isWrongSelected = isSubmitted && isSelected && !isCorrect;

               let rowClass = styles.optionRow;
               if (isSelected) rowClass += ` ${styles.optionSelected}`;
               if (isCorrect) rowClass += ` ${styles.optionCorrect}`;
               if (isWrongSelected) rowClass += ` ${styles.optionIncorrect}`;

               return (
                  <div key={key} className={rowClass} onClick={() => handleSelectAnswer(q.id, key)}>
                    <span className={styles.optionLabel}>{key}.</span>
                    <span className={styles.optionText}>{val as string}</span>
                  </div>
               );
            })}
          </div>
        )}

        {/* If options failed to parse but it's 1-16 or 18-23, show A B C D buttons */}
        {q.type === "text" && !isMultipleBlanks && !isTextMode && (
           <div className={styles.optionsContainer}>
             <div style={{display: 'flex', gap: '1rem'}}>
               {['A', 'B', 'C', 'D'].map(key => {
                  const isSelected = userAnswers[q.id] === key;
                  return (
                    <button 
                      key={key} 
                      className={`${styles.letterBtn} ${isSelected ? styles.letterBtnSelected : ''}`}
                      onClick={() => handleSelectAnswer(q.id, key)}
                    >
                      {key}
                    </button>
                  )
               })}
             </div>
           </div>
        )}

        {/* Multiple blanks like Q17 */}
        {q.id === "17" && (
           <div className={styles.subQuestionBlock}>
             <div style={{
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                fontWeight: '600',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
             }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Vui lòng xem chi tiết các đáp án A, B, C, D của câu 17 trong file PDF bên trái.
             </div>
             {[1,2,3,4,5,6].map(i => {
                const subId = `17.${i}`;
                return (
                  <div key={subId} style={{marginBottom: '1.5rem'}}>
                    <div className={styles.subQuestionLabel}>Blank {subId}</div>
                    <div style={{display: 'flex', gap: '0.75rem'}}>
                      {['A', 'B', 'C', 'D'].map(key => {
                         const isSelected = userAnswers[subId] === key;
                         return (
                           <button 
                              key={key}
                              onClick={() => handleSelectAnswer(subId, key)}
                              className={`${styles.letterBtn} ${isSelected ? styles.letterBtnSelected : ''}`}
                           >
                             {key}
                           </button>
                         )
                      })}
                    </div>
                  </div>
                )
             })}
           </div>
        )}

        {/* Multiple blanks like Q30 (Text) */}
        {q.id === "30" && (
           <div className={styles.subQuestionBlock}>
             {[1,2].map(i => {
                const subId = `30.${i}`;
                return (
                  <div key={subId} style={{marginBottom: '1rem'}}>
                    <div className={styles.subQuestionLabel}>Blank {subId}</div>
                    <textarea 
                       className={styles.textInput}
                       placeholder="Nhập câu trả lời tự luận..."
                       value={userAnswers[subId] || ''}
                       onChange={(e) => handleTextAnswer(subId, e.target.value)}
                    />
                  </div>
                )
             })}
           </div>
        )}

        {/* Text Mode (Sentence Rewrite, Word Form) */}
        {isTextMode && (
           <div className={styles.optionsContainer}>
             <textarea 
               className={styles.textInput}
               placeholder="Nhập câu trả lời tự luận (có thể nhập nhiều dòng)..."
               value={userAnswers[q.id] || ''}
               onChange={(e) => handleTextAnswer(q.id, e.target.value)}
               rows={3}
             />
             {isSubmitted && (
                <div className={`${styles.feedbackBox} ${styles.feedbackCorrect}`}>
                   <strong>Ghi nhận:</strong> Câu tự luận cần giáo viên chấm thủ công.
                </div>
             )}
           </div>
        )}
      </div>
      
      {extraPassage && (
         <div className={styles.questionCard} style={{ marginTop: '2rem', borderLeft: '4px solid var(--primary)' }}>
            <div className={styles.questionLabel}>Reading Passage (For Questions 18 - 23)</div>
            <div className={styles.prompt} style={{ marginBottom: 0 }}>{extraPassage}</div>
         </div>
      )}
      </React.Fragment>
    );
  };

  if (!isStarted) {
    return (
      <div className={styles.onboardingContainer}>
         <div className={styles.onboardingCard}>
           <h1 className={styles.onboardingTitle}>{test.title}</h1>
           <p className={styles.onboardingSubtitle}>Thời gian: {test.timeLimit} phút | {test.questionCount} câu hỏi</p>
           
           <div className={styles.inputGroup}>
             <label className={styles.inputLabel}>Họ và tên học sinh:</label>
             <input 
               type="text" 
               className={styles.nameInput}
               placeholder="Nhập họ tên của bạn..."
               value={studentName}
               onChange={(e) => setStudentName(e.target.value)}
               autoFocus
             />
           </div>

           <button 
             className={styles.submitBtn} 
             onClick={() => setIsStarted(true)}
             disabled={studentName.trim().length < 2}
             style={{ opacity: studentName.trim().length < 2 ? 0.5 : 1, width: '100%' }}
           >
             Bắt đầu làm bài
           </button>
           <div style={{ marginTop: '1rem' }}>
              <Link href="/" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'underline' }}>
                Quay lại trang chủ
              </Link>
           </div>
         </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Quay lại
          </Link>
          <h1 className={styles.title}>{test.title}</h1>
        </div>
        
        {!isSubmitted && (
          <div className={`${styles.timer} ${timeLeft < 300 ? styles.timerWarning : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </header>

      <main className={styles.mainLayout} style={{display: 'flex', flexDirection: 'row'}}>
        {/* LEFT: Original PDF Fallback */}
        <div style={{flex: 1, borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)'}}>
           <iframe src={`/pdfs/${test.filename}#toolbar=0`} style={{width: '100%', height: '100%', border: 'none'}} />
        </div>

        {/* RIGHT: Native Scrollable Quiz */}
        <div className={styles.questionsColumn} style={{flex: 1, overflowY: 'auto', paddingRight: '1rem', maxHeight: 'calc(100vh - 120px)'}}>
          {isSubmitted && (
            <div className={styles.resultHeader}>
              <h2>Kết quả bài làm</h2>
              <div className={styles.scoreCircle}>
                <span className={styles.scoreValue}>{score}</span>
                <span className={styles.scoreScale}>/ 10</span>
              </div>
              <p>Phần tự luận cần đối chiếu tay với đáp án trong file PDF bên trái.</p>
              <button className={styles.submitBtn} onClick={handleRetry} style={{marginTop: '1rem'}}>
                Làm lại bài
              </button>
            </div>
          )}

          {!isSubmitted && (
             <div style={{background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', marginBottom: '1rem', border: '1px solid var(--primary)'}}>
                <h3 style={{margin: '0 0 0.5rem 0', color: 'var(--primary)'}}>Giao diện Trực tiếp (Native)</h3>
                <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                   Bạn có thể đọc PDF bên trái và chọn/nhập đáp án trực tiếp vào từng câu hỏi bên dưới. Các câu viết lại câu đã được cấp khung nhập văn bản lớn (Textarea).
                </p>
             </div>
          )}

          {test.questions.map((q: any) => renderQuestionBlock(q))}

          {!isSubmitted && (
            <div className={styles.actions}>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Đang nộp..." : "Nộp bài & Chấm điểm"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
