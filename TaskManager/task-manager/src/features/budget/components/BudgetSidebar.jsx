import React from 'react';

import {
  NavLink,
} from 'react-router-dom';

import {
  BudgetIcon,
  ChartIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
  TransactionIcon,
  WalletIcon,
} from '@/components/icons/Icons';

/*===========================================================
  Budget Navigation Items:
  => Shared by desktop sidebar and mobile/tablet navigation.
===========================================================*/
const navigationItems = [
  {
    label: 'Overview',
    to: '/budget',
    icon: BudgetIcon,
    end: true,
  },
  {
    label: 'Budget',
    to: '/budget/months',
    icon: ChartIcon,
  },
  {
    label: 'Accounts',
    to: '/budget/accounts',
    icon: WalletIcon,
  },
  {
    label: 'Bills',
    to: '/budget/bills',
    icon: ReceiptIcon,
  },
  {
    label: 'Transactions',
    to: '/budget/transactions',
    icon: TransactionIcon,
  },
  {
    label: 'Recurring Bills',
    to: '/budget/recurring-bills',
    icon: RepeatIcon,
  },
  {
    label: 'Settings',
    to: '/budget/settings',
    icon: SettingsIcon,
  },
];

/*===========================================================
  getDesktopLinkClass:
  => Styling for large-screen sidebar navigation.
===========================================================*/
const getDesktopLinkClass = ({
  isActive,
}) => {
  return [
    'group flex items-center gap-3 rounded-xl px-3 py-3',
    'text-sm font-medium transition-colors duration-200',

    isActive
      ? 'bg-white/15 text-white'
      : 'text-blue-100/75 hover:bg-white/10 hover:text-white',
  ].join(' ');
};

/*===========================================================
  getMobileLinkClass:
  => Styling for mobile/tablet horizontal navigation.
===========================================================*/
const getMobileLinkClass = ({
  isActive,
}) => {
  return [
    'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5',
    'text-sm font-medium transition-colors duration-200',

    isActive
      ? 'bg-[var(--app-primary)] text-white shadow-sm'
      : 'bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text)]',
  ].join(' ');
};

/*===========================================================
  BudgetSidebar:
  => Budget feature navigation.

  Responsive behavior:
  => Below lg:
     Horizontal, scrollable navigation.

  => lg+:
     Fixed-width left sidebar.
===========================================================*/
const BudgetSidebar = () => {
  return (
    <>
      {/*=======================================================
        Desktop Sidebar
        => Large screens only.
      =======================================================*/}
      <aside
        className="
          sticky
          top-16

          hidden
          h-[calc(100vh-4rem)]
          w-64
          shrink-0
          flex-col

          bg-[var(--budget-sidebar-bg)]

          px-4
          py-6

          lg:flex
        "
      >
        {/*=====================================================
          Sidebar Heading
        =====================================================*/}
        <div className="mb-8 px-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200/70">
            Finance Center
          </p>

          <h2 className="mt-2 text-xl font-bold text-white">
            My Budget
          </h2>

          <p className="mt-1 text-sm text-blue-100/60">
            Plan, track, and review
          </p>
        </div>

        {/*=====================================================
          Desktop Navigation
        =====================================================*/}
        <nav className="space-y-1">
          {navigationItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={
                    getDesktopLinkClass
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              );
            }
          )}
        </nav>

        {/*=====================================================
          Budget Health
        =====================================================*/}
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">
            Budget health
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-100/65">
            You have assigned 58% of your planned income.
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[58%] rounded-full bg-emerald-400" />
          </div>
        </div>
      </aside>

      {/*=======================================================
        Mobile / Tablet Navigation
        => Uses full width.
        => Horizontal scrolling prevents items from pushing
           the Budget content off-screen.
      =======================================================*/}
      <div
        className="
          sticky
          top-16
          z-30

          w-full
          min-w-0

          border-b
          border-[var(--app-border)]

          bg-[var(--app-bg)]/95
          backdrop-blur

          px-3
          py-3

          lg:hidden
        "
      >
        <nav
          className="
            flex
            w-full
            min-w-0
            gap-2

            overflow-x-auto
            overscroll-x-contain

            pb-1
          "
        >
          {navigationItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={
                    getMobileLinkClass
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />

                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>
                </NavLink>
              );
            }
          )}
        </nav>
      </div>
    </>
  );
};

export default BudgetSidebar;