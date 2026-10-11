import React, { useState, useEffect } from 'react';
import {
  Mail,
  Briefcase,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import './Profile.css';

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

export function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    targetRole: 'Software Engineer',
    experienceLevel: 'entry',
    education: '',
    skills: '',
    bio: '',
  });

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize from auth context
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        targetRole: user.profile?.target_role || 'Software Engineer',
        experienceLevel: user.profile?.experience_level || 'entry',
        education: user.profile?.education || '',
        skills: user.profile?.skills || '',
        bio: user.profile?.bio || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setProfileSuccess('');
    setProfileError('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordSuccess('');
    setPasswordError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsSavingProfile(true);

    try {
      await updateProfile({
        first_name: profileData.firstName.trim(),
        last_name: profileData.lastName.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
        target_role: profileData.targetRole,
        experience_level: profileData.experienceLevel,
        education: profileData.education.trim(),
        skills: profileData.skills.trim(),
        bio: profileData.bio.trim(),
      });
      setProfileSuccess('Profile updated successfully!');
    } catch (err) {
      const resp = err.response?.data;
      if (resp && typeof resp === 'object') {
        const firstKey = Object.keys(resp)[0];
        const val = Array.isArray(resp[firstKey]) ? resp[firstKey][0] : resp[firstKey];
        setProfileError(`${firstKey}: ${val}`);
      } else {
        setProfileError('Failed to update profile. Please try again.');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword({
        old_password: passwordData.oldPassword,
        new_password: passwordData.newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.old_password) {
        setPasswordError(Array.isArray(resp.old_password) ? resp.old_password[0] : resp.old_password);
      } else if (resp?.new_password) {
        setPasswordError(Array.isArray(resp.new_password) ? resp.new_password[0] : resp.new_password);
      } else if (resp?.detail) {
        setPasswordError(resp.detail);
      } else {
        setPasswordError('Failed to change password. Please verify your current password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitial = (user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'User';

  const memberSince = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="profile-page" id="profile-page">
      {/* Profile Header Banner */}
      <div className="profile-header-banner">
        <div className="profile-header-left">
          <div className="profile-avatar-circle" aria-hidden="true">
            {userInitial}
          </div>
          <div className="profile-header-info">
            <h1 className="profile-display-name">{displayName}</h1>
            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} />
                {user?.email || 'No email provided'}
              </span>
              <span className="profile-meta-item">
                <Briefcase size={14} />
                {user?.profile?.target_role || 'Candidate'}
              </span>
              <span className="profile-meta-item">
                <Clock size={14} />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
        <div className="profile-badge-pill">
          {EXPERIENCE_OPTIONS.find((o) => o.value === user?.profile?.experience_level)?.label ||
            'Entry Level'}
        </div>
      </div>

      <div className="profile-content-grid">
        {/* Left Column: Personal & Professional Info */}
        <div className="profile-main-col">
          <Card className="profile-card">
            <CardHeader
              title="Personal & Career Information"
              subtitle="Update your profile details and career preferences used to generate mock interviews."
            />
            <CardBody>
              {profileSuccess && (
                <div className="profile-alert success" role="alert">
                  <CheckCircle2 size={16} />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="profile-alert error" role="alert">
                  <AlertCircle size={16} />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="profile-form">
                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="profile-first-name" className="form-label">
                      First Name
                    </label>
                    <input
                      id="profile-first-name"
                      name="firstName"
                      type="text"
                      className="form-input"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="profile-last-name" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="profile-last-name"
                      name="lastName"
                      type="text"
                      className="form-input"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="profile-email" className="form-label">
                      Email Address
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      className="form-input"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="profile-phone" className="form-label">
                      Phone Number
                    </label>
                    <input
                      id="profile-phone"
                      name="phone"
                      type="tel"
                      className="form-input"
                      placeholder="+1 (555) 000-0000"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label htmlFor="profile-role" className="form-label">
                      Target Job Role
                    </label>
                    <select
                      id="profile-role"
                      name="targetRole"
                      className="form-select"
                      value={profileData.targetRole}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="profile-experience" className="form-label">
                      Experience Level
                    </label>
                    <select
                      id="profile-experience"
                      name="experienceLevel"
                      className="form-select"
                      value={profileData.experienceLevel}
                      onChange={handleProfileChange}
                      disabled={isSavingProfile}
                    >
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="profile-education" className="form-label">
                    Highest Education / Degree
                  </label>
                  <input
                    id="profile-education"
                    name="education"
                    type="text"
                    className="form-input"
                    placeholder="e.g. B.S. in Computer Science, University of Technology"
                    value={profileData.education}
                    onChange={handleProfileChange}
                    disabled={isSavingProfile}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="profile-skills" className="form-label">
                    Core Skills & Technologies
                  </label>
                  <input
                    id="profile-skills"
                    name="skills"
                    type="text"
                    className="form-input"
                    placeholder="e.g. React, Node.js, Python, Django, MySQL, AWS, Docker"
                    value={profileData.skills}
                    onChange={handleProfileChange}
                    disabled={isSavingProfile}
                  />
                  <span className="form-helper">Separate multiple skills with commas.</span>
                </div>

                <div className="form-field">
                  <label htmlFor="profile-bio" className="form-label">
                    Professional Summary / Bio
                  </label>
                  <textarea
                    id="profile-bio"
                    name="bio"
                    rows={4}
                    className="form-textarea"
                    placeholder="Brief background about yourself, career goals, and what roles you are preparing for..."
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    disabled={isSavingProfile}
                  />
                </div>

                <div className="profile-form-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSavingProfile}
                    id="save-profile-btn"
                  >
                    <Save size={16} />
                    <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Security & Password */}
        <div className="profile-side-col">
          <Card className="profile-card">
            <CardHeader
              title="Security & Password"
              subtitle="Update your password to keep your account safe."
            />
            <CardBody>
              {passwordSuccess && (
                <div className="profile-alert success" role="alert">
                  <CheckCircle2 size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="profile-alert error" role="alert">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="profile-form">
                <div className="form-field">
                  <label htmlFor="old-password" className="form-label">
                    Current Password
                  </label>
                  <input
                    id="old-password"
                    name="oldPassword"
                    type="password"
                    className="form-input"
                    placeholder="Enter current password"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    disabled={isChangingPassword}
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="new-password" className="form-label">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirm-new-password" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter new password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={isChangingPassword}
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  fullWidth
                  disabled={isChangingPassword}
                  id="change-password-btn"
                >
                  <Lock size={16} />
                  <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Profile;
