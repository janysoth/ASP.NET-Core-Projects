import React, { useMemo } from 'react';

const ProfileOverviewCard = ({ user }) => {
  const memberSince = useMemo(() => {
    if (!user?.createdAtUtc) {
      return 'Not available';
    }

    return new Date(user.createdAtUtc).toLocaleDateString();
  }, [user]);

  const accountAge = useMemo(() => {
    if (!user?.createdAtUtc) {
      return 'Not available';
    }

    const created = new Date(user.createdAtUtc);
    const now = new Date();

    const months =
      (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

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

  const cardClass =
    'rounded-xl bg-[var(--app-surface-muted)] p-4';

  const labelClass =
    'text-sm text-[var(--app-text-muted)]';

  const valueClass =
    'mt-1 font-semibold text-[var(--app-text)]';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className={cardClass}>
        <p className={labelClass}>
          Member Since
        </p>

        <p className={valueClass}>
          {memberSince}
        </p>
      </div>

      <div className={cardClass}>
        <p className={labelClass}>
          Account Age
        </p>

        <p className={valueClass}>
          {accountAge}
        </p>
      </div>

      <div className={cardClass}>
        <p className={labelClass}>
          Profile Completion
        </p>

        <p className={valueClass}>
          {profileCompletion}%
        </p>
      </div>

      <div className={cardClass}>
        <p className={labelClass}>
          Security Level
        </p>

        <p className="mt-1 font-semibold text-green-500">
          {securityLevel}
        </p>
      </div>
    </div>
  );
};

export default ProfileOverviewCard;