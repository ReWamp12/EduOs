'use client';

import React, { useState } from 'react';
import { Sparkles, Check, Download, Send, Sliders, BookOpen, Layers, Award } from 'lucide-react';

export const TeacherAIQuestions: React.FC = () => {
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('Rotational Dynamics & Moment of Inertia');
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('JEE Advanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPaper, setGeneratedPaper] = useState<any>(null);

  const sampleGeneratedPaper = {
    title: 'JEE Advanced Practice Test: Rotational Mechanics & Fixed Axis Dynamics',
    totalMarks: 40,
    durationMinutes: 45,
    questions: [
      {
        number: 1,
        type: 'Multiple Choice (Single Correct)',
        marks: 4,
        negativeMarks: -1,
        question:
          'A solid cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination θ. What is the minimum coefficient of static friction μ required for pure rolling?',
        options: ['(1/3) tan θ', '(1/2) tan θ', '(2/3) tan θ', '(1/4) tan θ'],
        correctOption: 0,
        solution:
          'For a solid cylinder, I = (1/2)MR². The linear acceleration a = g sin θ / (1 + I/MR²) = (2/3)g sin θ. Friction f = Iα/R = (1/3)Mg sin θ. For no slip: f ≤ μN = μMg cos θ. Hence, μ ≥ (1/3) tan θ.',
      },
      {
        number: 2,
        type: 'Numerical Value Type',
        marks: 4,
        negativeMarks: 0,
        question:
          'A uniform thin rod of length 2m and mass 3kg is free to rotate in a vertical plane about a horizontal axis through its top end. If it is released from the horizontal position, find its angular velocity (in rad/s) when it becomes vertical. (Take g = 10 m/s²)',
        correctAnswer: '3.87 rad/s (or √15 rad/s)',
        solution:
          'By conservation of energy: Loss in PE = Gain in Rotational KE. Mg(L/2) = (1/2)Iω². Here I = (1/3)ML². Thus, Mg(L/2) = (1/6)ML²ω² => ω = √(3g/L) = √(3 × 10 / 2) = √15 ≈ 3.87 rad/s.',
      },
      {
        number: 3,
        type: 'Assertion & Reasoning',
        marks: 4,
        negativeMarks: -1,
        question:
          'Assertion (A): Moment of inertia of a body is not unique and depends on the axis of rotation chosen.\nReason (R): Parallel axis theorem can only be applied when one of the axes passes through the center of mass.',
        options: [
          'Both A and R are true and R is the correct explanation of A.',
          'Both A and R are true but R is NOT the correct explanation of A.',
          'A is true but R is false.',
          'A is false but R is true.',
        ],
        correctOption: 1,
        solution:
          'Both statements are correct. Moment of inertia varies with axis geometry. Parallel axis theorem I = I_cm + Md² strictly requires one axis to be through the CM.',
      },
    ],
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPaper(sampleGeneratedPaper);
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} color="#06B6D4" /> AI Question Paper &amp; Rubric Studio
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Generate balanced test papers with model solutions and marking rubrics in seconds
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '24px' }}>
        {/* Controls Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Paper Configuration</h3>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>SUBJECT</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              <option>Physics</option>
              <option>Physical Chemistry</option>
              <option>Organic Chemistry</option>
              <option>Mathematics</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TARGET CHAPTER</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              <option>Rotational Dynamics &amp; Moment of Inertia</option>
              <option>Thermodynamics &amp; Kinetic Theory</option>
              <option>Definite Integrals &amp; Area Under Curves</option>
              <option>Chemical Bonding &amp; Molecular Structure</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>TARGET EXAM BENCHMARK</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                marginTop: '6px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
              }}
            >
              <option>JEE Advanced (Multi-concept &amp; Numerical)</option>
              <option>JEE Main (Standard Speed &amp; Accuracy)</option>
              <option>NEET UG (Direct Formula &amp; NCERT High-Yield)</option>
              <option>Olympiad / KVPY Advanced</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              NUMBER OF QUESTIONS: <strong style={{ color: 'var(--primary)' }}>{numQuestions}</strong>
            </label>
            <input
              type="range"
              min="5"
              max="25"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              style={{ width: '100%', marginTop: '8px', accentColor: '#4F46E5' }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary"
            style={{ marginTop: '10px', background: 'linear-gradient(135deg, #06B6D4, #4F46E5)' }}
          >
            <Sparkles size={16} />
            {isGenerating ? 'Synthesizing Questions...' : 'Generate Balanced Question Paper'}
          </button>
        </div>

        {/* Generated Output Preview */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {generatedPaper ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div>
                  <span className="badge badge-success">Generated by EduOS AI Engine</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '6px' }}>{generatedPaper.title}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Total Marks: {generatedPaper.totalMarks} &bull; Suggested Time: {generatedPaper.durationMinutes} Mins
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    <Download size={14} /> PDF
                  </button>
                  <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                    <Send size={14} /> Publish to LMS
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '520px', overflowY: 'auto' }}>
                {generatedPaper.questions.map((q: any) => (
                  <div
                    key={q.number}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.9rem' }}>
                        Question {q.number}
                      </span>
                      <span className="badge badge-primary">
                        {q.marks} Marks ({q.negativeMarks} Negative)
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {q.question}
                    </p>

                    {q.options && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                        {q.options.map((opt: string, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px',
                              background: idx === q.correctOption ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0, 0, 0, 0.2)',
                              border: idx === q.correctOption ? '1px solid #10B981' : '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              fontSize: '0.82rem',
                              color: idx === q.correctOption ? '#34D399' : 'var(--text-secondary)',
                              fontWeight: idx === q.correctOption ? 700 : 500,
                            }}
                          >
                            ({String.fromCharCode(65 + idx)}) {opt}
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{
                      marginTop: '12px',
                      padding: '10px 12px',
                      background: 'rgba(79, 70, 229, 0.08)',
                      borderLeft: '3px solid #4F46E5',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <strong style={{ color: '#818CF8' }}>Model Solution &amp; Step Rubric:</strong>
                      <div style={{ marginTop: '2px' }}>{q.solution}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '380px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: '12px',
            }}>
              <Sparkles size={40} color="#06B6D4" style={{ opacity: 0.5 }} />
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Configure parameters on the left to generate an AI Question Paper
              </div>
              <div style={{ fontSize: '0.8rem', maxWidth: '320px' }}>
                AI ensures balanced difficulty weighting, LaTeX equations, and complete step-by-step marking rubrics.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
