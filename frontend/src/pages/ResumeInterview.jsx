import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Play,
  ChevronLeft,
  Loader2,
  Sparkles,
  RefreshCw,
  Briefcase,
  Code2,
  GraduationCap,
  Calendar,
  Layers,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getActiveResume, uploadResume, deleteResume } from '../api/resumes';
import { createSession, startSession } from '../api/interviews';
import './ResumeInterview.css';

const DIFFICULTY_INFO = {
  easy: { label: 'Easy', desc: 'Foundational concepts, project overviews', color: '#16a34a' },
  medium: { label: 'Medium', desc: 'Technical depth, architecture & trade-offs', color: '#f59e0b' },
  hard: { label: 'Hard', desc: 'Complex system scenarios, edge cases & deep scrutiny', color: '#dc2626' },
};

const QUESTION_COUNT_OPTIONS = [3, 5, 7, 10];

export function ResumeInterview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  // Resume state
  const [activeResume, setActiveResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  // Upload & parse state
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseStep, setParseStep] = useState(''); // 'uploading', 'extracting', 'analyzing'
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Setup form state
  const [jobRole, setJobRole] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    setLoading(true);
    setError('');
    try {
      const resume = await getActiveResume();
      if (resume) {
        setActiveResume(resume);
        setJobRole(resume.target_role || user?.profile?.target_role || 'Software Engineer');
        setShowUploader(false);
      } else {
        setActiveResume(null);
        setShowUploader(true);
        setJobRole(user?.profile?.target_role || 'Software Engineer');
      }
    } catch (err) {
      console.error('Failed to load active resume:', err);
      setError('Failed to load resume details. Please try again.');
      setShowUploader(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    setError('');
    setSuccessMsg('');

    // Format validation
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setError('Please upload a valid PDF (.pdf) or Word document (.docx).');
      return;
    }

    // Size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    setUploading(true);
    setParseStep('uploading');
    setUploadProgress(20);

    try {
      // Step simulation for good UX
      const timer1 = setTimeout(() => {
        setParseStep('extracting');
        setUploadProgress(60);
      }, 700);

      const timer2 = setTimeout(() => {
        setParseStep('analyzing');
        setUploadProgress(85);
      }, 1600);

      const parsedResume = await uploadResume(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 40) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      setUploadProgress(100);

      setActiveResume(parsedResume);
      setJobRole(parsedResume.target_role || jobRole || 'Software Engineer');
      setShowUploader(false);
      setSuccessMsg('Resume parsed and analyzed successfully! Ready to interview.');
    } catch (err) {
      console.error('Resume upload error:', err);
      const detail = err.response?.data?.detail || err.response?.data?.file?.[0] || 'Failed to process resume. Please verify the document format and try again.';
      setError(detail);
    } finally {
      setUploading(false);
      setParseStep('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!activeResume) return;
    if (!window.confirm('Are you sure you want to remove this resume? You will need to upload one to practice resume interviews.')) {
      return;
    }

    try {
      await deleteResume(activeResume.id);
      setActiveResume(null);
      setShowUploader(true);
      setSuccessMsg('Resume deleted. Please upload a new resume to continue.');
    } catch (err) {
      console.error('Failed to delete resume:', err);
      setError('Failed to delete resume. Please try again.');
    }
  };

  const handleStartInterview = async () => {
    if (!activeResume) {
      setError('Please upload and analyze a resume before starting this interview.');
      setShowUploader(true);
      return;
    }

    if (!jobRole.trim()) {
      setError('Please provide a target job role.');
      return;
    }

    setError('');
    setStarting(true);

    try {
      // Step 1: Create session with interview_type='resume' and linked resume_id
      const session = await createSession({
        interview_type: 'resume',
        job_role: jobRole.trim(),
        difficulty,
        total_questions: totalQuestions,
        resume_id: activeResume.id,
      });

      // Step 2: Start session (generates tailored resume questions via Gemini)
      await startSession(session.id);

      // Step 3: Transition to live interview runner
      navigate(`/interview/session/${session.id}`);
    } catch (err) {
      console.error('Failed to start resume interview:', err);
      const msg = err.response?.data?.detail || 'Failed to start interview session. Please try again.';
      setError(msg);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="resume-interview-page">
        <div className="resume-loading">
          <Loader2 size={32} className="spin-icon" />
          <span>Loading resume configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="resume-interview-page" id="resume-interview-container">
      {/* Top Header */}
      <div className="resume-page-header">
        <button
          type="button"
          className="resume-back-btn"
          onClick={() => navigate('/')}
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>
        <div className="resume-header-titles">
          <div className="resume-badge">
            <Sparkles size={14} className="resume-badge-icon" />
            AI Resume Analysis
          </div>
          <h1 className="resume-main-title">Resume-Based Interview</h1>
          <p className="resume-main-subtitle">
            Practice personalized interview questions generated from your real resume projects, technologies, and work history.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="resume-alert resume-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="resume-alert resume-alert-success" role="alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Resume Details / Right Interview Config */}
      <div className="resume-content-layout">
        {/* Left Column: Active Resume or Uploader */}
        <div className="resume-left-col">
          {activeResume && !showUploader ? (
            <div className="active-resume-card" id="active-resume-card">
              <div className="active-resume-header">
                <div className="resume-file-info">
                  <div className="resume-icon-badge">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="resume-file-name">{activeResume.file_name}</h3>
                    <div className="resume-meta-row">
                      <span className="resume-format-pill">{activeResume.file_type.toUpperCase()}</span>
                      <span className="resume-size-text">
                        {(activeResume.file_size / 1024).toFixed(0)} KB
                      </span>
                      <span className="resume-date-text">
                        <Calendar size={12} />
                        {new Date(activeResume.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="resume-card-actions">
                  <button
                    type="button"
                    className="resume-btn-secondary"
                    onClick={() => setShowUploader(true)}
                    title="Replace with another resume"
                  >
                    <RefreshCw size={14} />
                    Replace
                  </button>
                  <button
                    type="button"
                    className="resume-btn-danger"
                    onClick={handleDeleteResume}
                    title="Delete resume"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="resume-ready-status">
                <CheckCircle2 size={16} className="text-success" />
                <span>Verified & Analyzed for AI Interviewing</span>
              </div>

              {/* Candidate Info */}
              {(activeResume.candidate_name || activeResume.target_role) && (
                <div className="resume-candidate-row">
                  {activeResume.candidate_name && (
                    <div className="candidate-data-item">
                      <span className="candidate-label">Candidate</span>
                      <span className="candidate-value">{activeResume.candidate_name}</span>
                    </div>
                  )}
                  {activeResume.target_role && (
                    <div className="candidate-data-item">
                      <span className="candidate-label">Detected Role</span>
                      <span className="candidate-value">{activeResume.target_role}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Executive Summary */}
              {activeResume.summary && (
                <div className="resume-section-box">
                  <h4 className="section-box-title">
                    <Sparkles size={14} className="text-indigo" />
                    AI Profile Summary
                  </h4>
                  <p className="section-box-text">{activeResume.summary}</p>
                </div>
              )}

              {/* Extracted Skills */}
              {activeResume.skills && activeResume.skills.length > 0 && (
                <div className="resume-section-box">
                  <h4 className="section-box-title">
                    <Code2 size={14} className="text-indigo" />
                    Extracted Skills ({activeResume.skills.length})
                  </h4>
                  <div className="resume-skills-chips">
                    {activeResume.skills.map((skill, idx) => (
                      <span key={idx} className="resume-skill-pill">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Preview */}
              {activeResume.projects && activeResume.projects.length > 0 && (
                <div className="resume-section-box">
                  <h4 className="section-box-title">
                    <Layers size={14} className="text-indigo" />
                    Key Projects ({activeResume.projects.length})
                  </h4>
                  <div className="resume-project-list">
                    {activeResume.projects.slice(0, 3).map((proj, idx) => (
                      <div key={idx} className="resume-project-item">
                        <div className="project-title-row">
                          <strong className="project-name">{proj.title || 'Project'}</strong>
                          {proj.technologies && proj.technologies.length > 0 && (
                            <span className="project-tech-tags">
                              {proj.technologies.slice(0, 3).join(', ')}
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <p className="project-desc">{proj.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience Preview */}
              {activeResume.experience && activeResume.experience.length > 0 && (
                <div className="resume-section-box">
                  <h4 className="section-box-title">
                    <Briefcase size={14} className="text-indigo" />
                    Work Experience
                  </h4>
                  <div className="resume-exp-list">
                    {activeResume.experience.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="resume-exp-item">
                        <div className="exp-role-row">
                          <strong className="exp-role">{exp.role || 'Role'}</strong>
                          <span className="exp-company">@ {exp.company || 'Company'}</span>
                          {exp.duration && <span className="exp-duration">({exp.duration})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Upload Zone */
            <div className="resume-upload-wrapper">
              {activeResume && (
                <button
                  type="button"
                  className="cancel-upload-btn"
                  onClick={() => setShowUploader(false)}
                >
                  <ChevronLeft size={14} /> Back to Current Resume
                </button>
              )}

              <div
                className={`resume-dropzone ${isDragging ? 'dropzone-active' : ''} ${uploading ? 'dropzone-uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {uploading ? (
                  <div className="upload-progress-container">
                    <Loader2 size={36} className="spin-icon text-indigo" />
                    <div className="upload-step-text">
                      {parseStep === 'uploading' && 'Uploading document...'}
                      {parseStep === 'extracting' && 'Extracting text and tables...'}
                      {parseStep === 'analyzing' && 'Gemini AI parsing skills & projects...'}
                    </div>
                    <div className="upload-progress-bar-bg">
                      <div
                        className="upload-progress-bar-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <span className="upload-percent-text">{uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="upload-idle-container">
                    <div className="upload-icon-circle">
                      <UploadCloud size={32} />
                    </div>
                    <h3 className="upload-idle-title">
                      Upload your resume
                    </h3>
                    <p className="upload-idle-desc">
                      Drag and drop your document here, or <span className="text-link">browse files</span>
                    </p>
                    <div className="upload-formats-badge">
                      <span>PDF</span>
                      <span className="bullet">•</span>
                      <span>DOCX</span>
                      <span className="bullet">•</span>
                      <span>Up to 5MB</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="resume-privacy-notice">
                <Sparkles size={14} className="text-indigo" />
                <span>
                  Resumes are securely processed and private to your account. Used strictly to tailor interview questions.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interview Session Configuration */}
        <div className="resume-right-col">
          <div className="interview-config-card">
            <h2 className="config-card-title">Interview Configuration</h2>
            <p className="config-card-subtitle">
              Configure your interview parameters. Gemini will focus questions on your resume projects and technical claims.
            </p>

            {/* Target Role Field */}
            <div className="config-field-group">
              <label htmlFor="target-job-role" className="config-field-label">
                Target Job Role
              </label>
              <div className="config-input-wrapper">
                <Briefcase size={18} className="field-icon" />
                <input
                  id="target-job-role"
                  type="text"
                  className="config-text-input"
                  placeholder="e.g. Full Stack Developer, Data Scientist"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  disabled={starting}
                />
              </div>
              <span className="field-hint">
                Auto-detected from your resume. You can customize it if targeting a different position.
              </span>
            </div>

            {/* Difficulty Selector */}
            <div className="config-field-group">
              <label className="config-field-label">Difficulty Level</label>
              <div className="difficulty-pills-row">
                {['easy', 'medium', 'hard'].map((diff) => {
                  const info = DIFFICULTY_INFO[diff];
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      type="button"
                      className={`diff-pill-btn ${isSelected ? 'diff-pill-selected' : ''}`}
                      onClick={() => setDifficulty(diff)}
                      disabled={starting}
                    >
                      <span
                        className="diff-dot"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="diff-name">{info.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="diff-description">
                {DIFFICULTY_INFO[difficulty]?.desc}
              </p>
            </div>

            {/* Total Questions Count */}
            <div className="config-field-group">
              <label className="config-field-label">
                Number of Questions
              </label>
              <div className="question-count-row">
                {QUESTION_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={`q-count-btn ${totalQuestions === count ? 'q-count-selected' : ''}`}
                    onClick={() => setTotalQuestions(count)}
                    disabled={starting}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <div className="config-actions-row">
              <button
                type="button"
                className="btn-start-resume-interview"
                onClick={handleStartInterview}
                disabled={!activeResume || starting || uploading}
              >
                {starting ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    Generating Questions & Starting Session...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Start Resume Interview
                  </>
                )}
              </button>

              {!activeResume && (
                <p className="start-disabled-notice">
                  Please upload a resume first to unlock the interview.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeInterview;
