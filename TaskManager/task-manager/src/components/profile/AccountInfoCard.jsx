import React from 'react';

const AccountInfoCard = ({ user }) => {
  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Full Name</p>
        <p className="mt-1 font-medium text-slate-900">
          {user?.fullName || 'Not available'}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Email</p>
        <p
          className="mt-1 truncate font-medium text-slate-900"
          title={user?.email}
        >
          {user?.email || 'Not available'}
        </p>
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