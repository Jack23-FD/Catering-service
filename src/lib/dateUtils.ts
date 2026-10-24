export function getDaysLeft(dateString: string): {
  text: string;
  badgeClass: string;
  isToday: boolean;
  isPast: boolean;
  daysDiff: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDate = new Date(dateString);
  eventDate.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: 'Past Event',
      badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
      isToday: false,
      isPast: true,
      daysDiff: diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      text: 'Starts Today!',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-bold',
      isToday: true,
      isPast: false,
      daysDiff: 0,
    };
  }

  if (diffDays === 1) {
    return {
      text: 'Tomorrow (1 day left)',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
      isToday: false,
      isPast: false,
      daysDiff: 1,
    };
  }

  return {
    text: `${diffDays} days left`,
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 font-semibold',
    isToday: false,
    isPast: false,
    daysDiff: diffDays,
  };
}

export function formatEventDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
