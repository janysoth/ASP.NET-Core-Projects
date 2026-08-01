import React, { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import ExpandableSection from '../../components/common/ExpandableSection';
import AccountInfoCard from '../../components/profile/AccountInfoCard';
import ChangePasswordCard from '../../components/profile/ChangePasswordCard';
import PreferencesCard from '../../components/profile/PreferencesCard';
import ProfileCard from '../../components/profile/ProfileCard';
import ProfileOverviewCard from '../../components/profile/ProfileOverviewCard';

import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import {
  changePassword,
  updateProfileImage,
  updateProfileInfo,
} from '../../services/api';
import { USER_PASSWORD_FIELDS } from '../../utils/user/userFields';

const UserInfoPage = () => {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const backendUrl =
    process.env.REACT_APP_API_URL || 'http://localhost:5295';

  const form = useForm(USER_PASSWORD_FIELDS, () => ({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }));

  const {
    formData,
    hasErrors,
    handleChange,
    setSubmitted,
  } = form;

  const profileImageUrl = user?.profileImageUrl
    ? `${backendUrl}${user.profileImageUrl}`
    : '';

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmitted(true);
      setError('');
      setSuccess('');

      if (hasErrors) return;

      try {
        setLoading(true);

        await changePassword(
          {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          },
          token
        );

        setSuccess('Password changed successfully.');

        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1200);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          'Failed to change password.'
        );
      } finally {
        setLoading(false);
      }
    },
    [formData, hasErrors, token, navigate, setSubmitted]
  );

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const payload = new FormData();
      payload.append('file', file);

      const toastId = toast.loading('Uploading profile image...', {
        style: {
          background: '#334155',
          color: '#fff',
        },
      });

      try {
        setImageLoading(true);
        setError('');

        const response = await updateProfileImage(payload, token);

        updateUser(response.data.user);

        toast.success('Profile image updated successfully!', {
          id: toastId,
          icon: '📸',
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
      } catch (err) {
        toast.error(
          err.response?.data?.error ||
          'Failed to update profile image.',
          {
            id: toastId,
            icon: '❌',
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          }
        );
      } finally {
        setImageLoading(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [token, updateUser]
  );

  const handleUpdateProfile = useCallback(
    async (data) => {
      try {
        setProfileLoading(true);
        setError('');

        const response = await updateProfileInfo(data, token);

        updateUser(response.data.user);

        toast.success('Profile updated successfully!', {
          icon: '✅',
          style: {
            background: '#10b981',
            color: '#fff',
          },
        });
      } catch (err) {
        toast.error(
          err.response?.data?.error || 'Failed to update profile.',
          {
            icon: '❌',
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          }
        );
      } finally {
        setProfileLoading(false);
      }
    },
    [token, updateUser]
  );

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Account Settings
          </h1>

          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your profile information, email, image, and password.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {success}
          </div>
        )}

        <ExpandableSection
          title="Profile"
          description="Manage your profile image and display information."
          defaultOpen
        >
          <ProfileCard
            user={user}
            profileImageUrl={profileImageUrl}
            imageLoading={imageLoading}
            fileInputRef={fileInputRef}
            onChooseImage={handleChooseImage}
            onImageChange={handleImageChange}
          />
        </ExpandableSection>

        <ExpandableSection
          title="Account Information"
          description="View your account details."
        >
          <AccountInfoCard
            user={user}
            loading={profileLoading}
            onUpdateProfile={handleUpdateProfile}
          />
        </ExpandableSection>

        <ExpandableSection
          title="Account Overview"
          description="Review account age, completion, and security summary."
        >
          <ProfileOverviewCard user={user} />
        </ExpandableSection>

        <ExpandableSection
          title="Security Settings"
          description="Update your account password."
        >
          <ChangePasswordCard
            fields={USER_PASSWORD_FIELDS}
            formData={formData}
            handleChange={handleChange}
            onSubmit={handleSubmit}
            loading={loading}
            hasErrors={hasErrors}
          />
        </ExpandableSection>

        <ExpandableSection
          title="Preferences"
          description="Customize your app settings and todo behavior."
        >
          <PreferencesCard />
        </ExpandableSection>
      </div>
    </div>
  );
};

export default UserInfoPage;