const STATUS_LABELS: Record<number, string> = {
  2: 'Open',
  3: 'Pending',
  6: 'Waiting on Member',
  7: 'Waiting on Third Party',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
};

const PRIORITY_CLASS: Record<string, string> = {
  Urgent: 'freshdesk-badge-danger',
  High: 'freshdesk-badge-warning',
  Medium: 'freshdesk-badge-neutral',
  Low: 'freshdesk-badge-neutral',
};

export { STATUS_LABELS, PRIORITY_LABELS, PRIORITY_CLASS };
