import React from 'react';

const TodoFooterStats = ({
  isLoading,
  total,
  completed,
}) => {
  if (isLoading || total <= 0) return null;

  const percent =
    Math.round((completed / total) * 100) || 0;

  return (
    <div className="mt-8 border-t border-[var(--app-border)] pt-6 text-center text-sm text-[var(--app-text-muted)]">
      <p>
        {completed} of {total} completed • {percent}% done
      </p>
    </div>
  );
};

export default TodoFooterStats;