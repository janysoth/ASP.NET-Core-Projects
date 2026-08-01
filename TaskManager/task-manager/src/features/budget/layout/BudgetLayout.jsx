import React from 'react';
import { Outlet } from 'react-router-dom';

import BudgetSidebar from '../components/BudgetSidebar';

const BudgetLayout = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--app-bg)] text-[var(--app-text)]">
      <div className="flex w-full">
        <BudgetSidebar />

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BudgetLayout;