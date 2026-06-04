import React, { useMemo } from 'react';

const ProfileOverviewCard = ({ user }) => {
  const memberSince = useMemo(() => {
    if (!user?.createdAtUtc) {
      return 'Not available';
    }

    return new Date(
      user.createdAtUtc
    ).toLocaleDateString();
  }, [user]);

  const accountAge = useMemo(() => {
    if (!user?.createdAtUtc) {
      return 'Not available';
    }

    const created = new Date(
      user.createdAtUtc
    );

    const now = new Date();

    const months =
      (now.getFullYear() -
        created.getFullYear()) *
      12 +
      (now.getMonth() -
        created.getMonth());

    const years = Math.floor(
      months / 12
    );

    const remainingMonths =
      months % 12;

    if (years === 0) {
      return `${remainingMonths} month(s)`;
    }

    return `${years} year(s) ${remainingMonths} month(s)`;
  }, [user]);

  const profileCompletion = useMemo(() => {
    let score = 0;

    if (user?.fullName) {
      score += 50;
    }

    if (user?.profileImageUrl) {
      score += 50;
    }

    return score;
  }, [user]);

  const securityLevel = useMemo(() => {
    return 'Good';
  }, []);

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Member Since
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {memberSince}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Account Age
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {accountAge}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Profile Completion
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {profileCompletion}%
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Security Level
        </p>

        <p className="mt-1 font-semibold text-green-600">
          {securityLevel}
        </p>
      </div>

    </div>
  );
};

export default ProfileOverviewCard;