import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  Circle,
  Terminal,
  ArrowRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { getCodingProblems } from '../api/coding';
import Button from '../components/ui/Button';
import './CodingProblemsList.css';

export function CodingProblemsList() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchProblems() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCodingProblems();
        if (isMounted) {
          setProblems(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.error || 'Failed to load coding problems. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProblems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute metrics
  const totalCount = problems.length;
  const solvedCount = problems.filter((p) => p.user_status === 'solved').length;
  const easyCount = problems.filter((p) => p.difficulty === 'easy').length;
  const mediumCount = problems.filter((p) => p.difficulty === 'medium').length;
  const hardCount = problems.filter((p) => p.difficulty === 'hard').length;

  // Filter problems based on difficulty and search
  const filteredProblems = problems.filter((p) => {
    const matchesDifficulty =
      selectedDifficulty === 'all' || p.difficulty === selectedDifficulty;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesSearch;
  });

  return (
    <div className="coding-list-page" id="coding-practice-page">
      {/* Top Hero Banner */}
      <div className="coding-hero-card">
        <div className="coding-hero-info">
          <div className="coding-hero-badge">
            <Terminal size={16} />
            <span>Coding Practice Lab</span>
          </div>
          <h1 className="coding-hero-title">Practice Data Structures & Algorithms</h1>
          <p className="coding-hero-subtitle">
            Hone your problem-solving skills across Python 3, Java, and C++ with real-world technical interview challenges.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="coding-stats-grid">
          <div className="coding-stat-box">
            <span className="stat-label">Total Solved</span>
            <div className="stat-value-group">
              <Award size={18} className="text-accent-indigo" />
              <span className="stat-num">{solvedCount} / {totalCount}</span>
            </div>
          </div>
          <div className="coding-stat-box">
            <span className="stat-label">Easy</span>
            <div className="stat-value-group">
              <Zap size={18} className="text-easy" />
              <span className="stat-num">{easyCount}</span>
            </div>
          </div>
          <div className="coding-stat-box">
            <span className="stat-label">Medium</span>
            <div className="stat-value-group">
              <TrendingUp size={18} className="text-medium" />
              <span className="stat-num">{mediumCount}</span>
            </div>
          </div>
          <div className="coding-stat-box">
            <span className="stat-label">Hard</span>
            <div className="stat-value-group">
              <Terminal size={18} className="text-hard" />
              <span className="stat-num">{hardCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="coding-filter-toolbar">
        <div className="coding-difficulty-tabs" role="tablist">
          {['all', 'easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff}
              type="button"
              className={`coding-tab-btn ${selectedDifficulty === diff ? 'active' : ''}`}
              onClick={() => setSelectedDifficulty(diff)}
              role="tab"
              aria-selected={selectedDifficulty === diff}
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </button>
          ))}
        </div>

        <div className="coding-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search problems by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Problem Content */}
      {loading ? (
        <div className="coding-loading-state">
          <div className="coding-spinner" />
          <p>Loading coding challenges...</p>
        </div>
      ) : error ? (
        <div className="coding-error-state">
          <p>{error}</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      ) : filteredProblems.length === 0 ? (
        <div className="coding-empty-state">
          <p>No coding problems found matching your criteria.</p>
        </div>
      ) : (
        <div className="coding-table-card">
          <table className="coding-table" id="coding-problems-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Status</th>
                <th>Title</th>
                <th>Category</th>
                <th style={{ width: '130px' }}>Difficulty</th>
                <th style={{ width: '120px' }}>Testcases</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((prob) => {
                const isSolved = prob.user_status === 'solved';
                const isAttempted = prob.user_status === 'attempted';

                return (
                  <tr
                    key={prob.id}
                    className="coding-table-row"
                    onClick={() => navigate(`/coding-practice/${prob.slug}`)}
                  >
                    <td style={{ textAlign: 'center' }}>
                      {isSolved ? (
                        <CheckCircle2 size={18} className="status-icon solved" title="Solved" />
                      ) : isAttempted ? (
                        <Clock size={18} className="status-icon attempted" title="Attempted" />
                      ) : (
                        <Circle size={18} className="status-icon unsolved" title="Unsolved" />
                      )}
                    </td>
                    <td>
                      <div className="problem-title-cell">
                        <span className="problem-title">{prob.title}</span>
                      </div>
                    </td>
                    <td>
                      <span className="category-tag">{prob.category}</span>
                    </td>
                    <td>
                      <span className={`diff-pill diff-${prob.difficulty}`}>
                        {prob.difficulty.charAt(0).toUpperCase() + prob.difficulty.slice(1)}
                      </span>
                    </td>
                    <td>
                      <span className="testcases-count">
                        {prob.total_test_cases} cases
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="solve-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/coding-practice/${prob.slug}`);
                        }}
                      >
                        <span>{isSolved ? 'Review' : 'Solve'}</span>
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CodingProblemsList;
