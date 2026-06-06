import React, { useEffect, useState } from 'react';
import { validateEmail } from '../../utils/validation';

const AccountInfoCard = ({
  user,
  loading,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
    });
  }, [user]);

  const fullNameError =
    !form.fullName.trim()
      ? 'Full name is required.'
      : form.fullName.trim().length < 2
        ? 'Full name must be at least 2 characters.'
        : '';

  const emailError = validateEmail(form.email);

  const hasErrors = !!fullNameError || !!emailError;

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCancel = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
    });

    setIsEditing(false);
  };

  const handleSave = async () => {
    if (hasErrors) return;

    await onUpdateProfile({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
    });

    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Profile Details
          </p>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm font-medium text-indigo-600 hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-slate-500">
                Full Name
              </label>

              <input
                value={form.fullName}
                onChange={handleChange('fullName')}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500"
              />

              {fullNameError && (
                <p className="mt-1 text-sm text-red-600">
                  {fullNameError}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-slate-500">
                Email
              </label>

              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-indigo-500"
              />

              {emailError && (
                <p className="mt-1 text-sm text-red-600">
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || hasErrors}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="rounded-lg border px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-slate-500">Full Name</p>
              <p className="mt-1 font-medium text-slate-900">
                {user?.fullName || 'Not available'}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p
                className="mt-1 truncate font-medium text-slate-900"
                title={user?.email}
              >
                {user?.email || 'Not available'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">User ID</p>
        <p className="mt-1 break-all text-sm font-medium text-slate-900">
          {user?.id || 'Not available'}
        </p>
      </div>
    </div>
  );
};

export default AccountInfoCard;