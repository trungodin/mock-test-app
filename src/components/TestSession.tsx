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

  // Dictionary state
  const [dictWord, setDictWord] = useState('');
  const [dictTranslation, setDictTranslation] = useState('');
  const [dictPos, setDictPos] = useState<{x: number, y: number} | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [officialKeys, setOfficialKeys] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Timer logic
  useEffect(() => {
    if (!isStarted || isSubmitted || timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted, isStarted]);

  // Dictionary click outside listener
  useEffect(() => {
    const handleClick = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
         setDictPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    
    let fetchedKeys: Record<string, string> = {};
    try {
      const keyRes = await fetch(`/api/answer-keys?testId=${test.id}`);
      if (keyRes.ok) {
         const keyData = await keyRes.json();
         if (keyData.answers) fetchedKeys = keyData.answers;
      }
    } catch (e) {
      console.error("Failed to fetch answer key");
    }
    
    setOfficialKeys(fetchedKeys);

    let correctCount = 0;
    let totalScoreable = 40; // Hardcoded 40 items

    // Calculate...
    test.questions.forEach((q: any) => {
       if (q.id === "17") {
          for(let i=1; i<=6; i++) {
             const key = `17.${i}`;
             const correctAns = fetchedKeys[key] || q.subQuestions?.find((sq:any)=>sq.id===key)?.answer;
             if (userAnswers[key] && correctAns && userAnswers[key].toLowerCase() === correctAns.toLowerCase()) correctCount++;
          }
       } else if (q.id === "30") {
          for(let i=1; i<=2; i++) {
             const key = `30.${i}`;
             const correctAns = fetchedKeys[key];
             if (userAnswers[key] && correctAns && userAnswers[key].toLowerCase() === correctAns.toLowerCase()) correctCount++;
          }
       } else {
          const ans = userAnswers[q.id];
          const correctAns = fetchedKeys[q.id] || q.answer;
          if (ans && correctAns && ans.toLowerCase() === (correctAns || "").toLowerCase()) {
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
    setOfficialKeys({});
    setTimeLeft(test.timeLimit * 60);
    setIsSubmitted(false);
    setScore(0);
    setIsStarted(false);
    setStudentName('');
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setTimeout(async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      // If no valid text selected, ignore
      if (!text || text.length > 30 || text.split(' ').length > 3) {
         return;
      }
      
      // Basic check if it's mostly english letters (allow hyphen and quote)
      if (!/^[a-zA-Z\s'-]+$/.test(text)) return;

      const rect = selection?.getRangeAt(0).getBoundingClientRect();
      if (!rect) return;

      setDictPos({
        x: rect.left + rect.width / 2 + window.scrollX,
        y: rect.top + window.scrollY - 10
      });
      setDictWord(text);
      setDictTranslation('');
      setIsTranslating(true);

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: text })
        });
        const data = await res.json();
        if (data.translation) {
           setDictTranslation(data.translation);
        } else {
           setDictTranslation('Không tìm thấy bản dịch.');
        }
      } catch (err) {
        setDictTranslation('Lỗi kết nối từ điển.');
      } finally {
        setIsTranslating(false);
      }
    }, 10);
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
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
               const correctAns = officialKeys[q.id] || q.answer;
               const isCorrect = isSubmitted && correctAns === key;
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
                  const correctAns = officialKeys[q.id] || q.answer;
                  const isCorrect = isSubmitted && correctAns === key;
                  const isWrongSelected = isSubmitted && isSelected && !isCorrect;
                  
                  let btnClass = styles.letterBtn;
                  if (isSelected) btnClass += ` ${styles.letterBtnSelected}`;
                  if (isCorrect) btnClass += ` ${styles.optionCorrect}`;
                  if (isWrongSelected) btnClass += ` ${styles.optionIncorrect}`;

                  return (
                    <button 
                      key={key} 
                      className={btnClass}
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
                const correctAns = officialKeys[subId] || q.subQuestions?.find((sq:any)=>sq.id===subId)?.answer;
                return (
                  <div key={subId} style={{marginBottom: '1.5rem'}}>
                    <div className={styles.subQuestionLabel}>Blank {subId}</div>
                    <div style={{display: 'flex', gap: '0.75rem'}}>
                      {['A', 'B', 'C', 'D'].map(key => {
                         const isSelected = userAnswers[subId] === key;
                         const isCorrect = isSubmitted && correctAns === key;
                         const isWrongSelected = isSubmitted && isSelected && !isCorrect;
                         
                         let btnClass = styles.letterBtn;
                         if (isSelected) btnClass += ` ${styles.letterBtnSelected}`;
                         if (isCorrect) btnClass += ` ${styles.optionCorrect}`;
                         if (isWrongSelected) btnClass += ` ${styles.optionIncorrect}`;

                         return (
                           <button 
                              key={key}
                              onClick={() => handleSelectAnswer(subId, key)}
                              className={btnClass}
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
    <div className={styles.container} onMouseUp={handleMouseUp}>
      {/* Dictionary Tooltip */}
      {dictPos && (
        <div 
          className={styles.dictionaryTooltip} 
          style={{ left: dictPos.x, top: dictPos.y, transform: 'translate(-50%, -100%)' }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent click inside from closing it
        >
           <div className={styles.dictHeader}>
              <div className={styles.dictWord}>{dictWord}</div>
              <button className={styles.dictPronounce} onClick={() => playAudio(dictWord)} title="Phát âm">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                   <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                 </svg>
              </button>
           </div>
           
           <div className={styles.dictTranslation}>
              {isTranslating ? (
                <span className={styles.dictLoading}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                     <line x1="12" y1="2" x2="12" y2="6"></line>
                     <line x1="12" y1="18" x2="12" y2="22"></line>
                     <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                     <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                     <line x1="2" y1="12" x2="6" y2="12"></line>
                     <line x1="18" y1="12" x2="22" y2="12"></line>
                     <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                     <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                   </svg>
                   Đang dịch...
                </span>
              ) : (
                dictTranslation
              )}
           </div>
        </div>
      )}

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
