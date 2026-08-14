import React from 'react';

import {
  Outlet,
} from 'react-router-dom';

import BudgetSidebar from '../components/BudgetSidebar';

/*===========================================================
  BudgetLayout:
  => Shared layout for the entire Budget feature.

  Responsive behavior:
  => Mobile / tablet:
     Budget navigation appears across the top.
     Content uses the full available width.

  => Large screens:
     Budget navigation becomes the left sidebar.
     Content fills the remaining width.
===========================================================*/
const BudgetLayout = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--app-bg)] text-[var(--app-text)]">
      <div
        className="
          flex
          w-full
          min-w-0
          flex-col

          lg:flex-row
        "
      >
        {/*=====================================================
          Budget Navigation
        =====================================================*/}
        <BudgetSidebar />

        {/*=====================================================
          Budget Page Content
        =====================================================*/}
        <main
          className="
            min-w-0
            w-full
            flex-1
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BudgetLayout;