import { getTodayLocalDateString } from './helpers';

export const APP_CARDS = [
  {
    title: 'Task Manager',
    icon: '📝',
    route: '/todos',
    description: 'Manage your daily tasks efficiently',
  },

  {
    title: 'Budget App',
    icon: '📝',
    route: '/budget',
    description: 'Manage your daily tasks efficiently',
  },
];

export const TODO_INITIAL_FORM_STATE = {
  title: '',
  description: '',
  dueDate: getTodayLocalDateString(),
};

export const FILTER_OPTIONS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed'
};

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;