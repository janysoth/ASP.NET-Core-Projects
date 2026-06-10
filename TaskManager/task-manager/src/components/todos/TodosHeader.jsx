import React from 'react';

const TodosHeader = ({ activeCount }) => {
  return (
    <div className="mb-8 app-section-spacing">
      <h1 className="text-3xl font-bold text-[var(--app-text)]">
        My Todos
      </h1>

      <p className="mt-2 text-[var(--app-text-muted)]">
        You have{' '}
        <span className="font-semibold text-[var(--app-primary)]">
          {activeCount}
        </span>{' '}
        active{activeCount === 1 ? ' todo' : ' todos'} remaining
      </p>
    </div>
  );
};

export default TodosHeader;