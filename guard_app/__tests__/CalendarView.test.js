/* eslint-env jest */
import { render } from '@testing-library/react-native';
import React from 'react';

import CalendarView from '../src/components/calendar/CalendarView';
import { COLORS } from '../src/theme/colors';

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('CalendarView pinned shifts', () => {
  it('shows a pin marker on a day that has a pinned shift', () => {
    const shifts = [
      {
        id: '1',
        title: 'Night Security Guard',
        date: todayIso(),
        status: 'Available',
        pinned: true,
      },
  ];
    const { getByText } = render(
      <CalendarView shifts={shifts} onShiftPress={() => {}} colors={COLORS} />,
    );

  expect(getByText('📌')).toBeTruthy();
});

  it('does not show a pin marker when no shift on that day is pinned', () => {
    const shifts = [
      {
        id: '1',
        title: 'Night Security Guard',
        date: todayIso(),
        status: 'Available',
        pinned: false,
      },
    ];

    const { queryByText } = render(
      <CalendarView shifts={shifts} onShiftPress={() => {}} colors={COLORS} />,
    );

    expect(queryByText('📌')).toBeNull();
});
});
