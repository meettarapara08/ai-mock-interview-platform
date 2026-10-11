import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BotMessageSquare, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import './Register.css';

const ROLE_OPTIONS = [
  'Full Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Software Engineer',
  'DevOps / Cloud Engineer',
  'Data Scientist / AI Engineer',
  'Product Manager',
  'QA / Test Engineer',
];

const EXPERIENCE_OPTIONS = [
  { value: 'entry', label: 'Entry Level / Student' },
  { value: 'mid', label: 'Mid Level (1-3 yrs)' },
  { value: 'senior', label: 'Senior (3-7 yrs)' },
  { value: 'lead', label: 'Lead / Staff (7+ yrs)' },
];

export function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    targetRole: 'Full Stack Developer',
    experienceLevel: 'entry',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        target_role: formData.targetRole,
        experience_level: formData.experienceLevel,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const respData = err.response?.data;
      if (respData) {
        if (typeof respData === 'string') {
          setError(respData);
        } else if (respData.detail) {
          setError(respData.detail);
        } else {
          // Flatten first validation error
          const firstKey = Object.keys(respData)[0];
          const firstErr = Array.isArray(respData[firstKey])
            ? respData[firstKey][0]
            : respData[firstKey];
          setError(`${firstKey}: ${firstErr}`);
        }
      } else {
        setError('Registration failed. Please check your network and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container" id="register-page">
      <div className="auth-card register-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <BotMessageSquare size={26} />
            </div>
            <span className="auth-logo-title">AI Mock Interview</span>
          </div>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">
            Get personalized interview practice, instant AI feedback, and ace your dream role.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={18} className="auth-error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* First & Last Name */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="form-input"
                placeholder="e.g. Alex"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="form-input"
                placeholder="e.g. Morgan"
                value={formData.lastName}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Username & Email */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="username" className="form-label">
                Username <span className="required-star">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="form-input"
                placeholder="e.g. alexmorgan"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Email Address <span className="required-star">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="alex.morgan@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Target Role & Experience Level */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="targetRole" className="form-label">
                Target Role
              </label>
              <select
                id="targetRole"
                name="targetRole"
                className="form-select"
                value={formData.targetRole}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="experienceLevel" className="form-label">
                Experience Level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                className="form-select"
                value={formData.experienceLevel}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="form-grid-2">
            <div className="form-field">
              <label htmlFor="password" className="form-label">
                Password <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required-star">*</span>
              </label>
              <div className="input-wrapper">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isSubmitting}
            className="auth-submit-btn"
            id="register-submit-btn"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="auth-footer">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link" id="link-to-login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
