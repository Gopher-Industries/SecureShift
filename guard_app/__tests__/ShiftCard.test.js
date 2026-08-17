/* eslint-env jest */
import { render, fireEvent } from '@testing-library/react-native';
import React from 'react';

import ShiftCard from '../src/components/card/ShiftCard';
import { COLORS } from '../src/theme/colors';

const baseShift = {
  id: '1',
  title: 'Night Security Guard',
  company: 'Acme Corp',
  site: 'Warehouse A',
  rate: '$30/hour',
  date: '2026-08-20',
  time: '18:00 - 06:00',
  status: 'Available',
};

describe('ShiftCard pin/unpin', () => {
  it('does not render a pin button when onTogglePin is not provided', () => {
    const { queryByLabelText } = render(<ShiftCard shift={baseShift} colors={COLORS} />);

    expect(queryByLabelText('Pin shift')).toBeNull();
    expect(queryByLabelText('Unpin shift')).toBeNull();
  });

  it('renders a "Pin shift" button when the shift is not pinned', () => {
    const onTogglePin = jest.fn();
    const shift = { ...baseShift, pinned: false };
    const { getByLabelText, queryByLabelText } = render(
      <ShiftCard shift={shift} colors={COLORS} onTogglePin={onTogglePin} />,
    );

    expect(getByLabelText('Pin shift')).toBeTruthy();
    expect(queryByLabelText('Unpin shift')).toBeNull();
  });

  it('renders an "Unpin shift" button when the shift is pinned', () => {
    const onTogglePin = jest.fn();
    const shift = { ...baseShift, pinned: true };
    const { getByLabelText, queryByLabelText } = render(
      <ShiftCard shift={shift} colors={COLORS} onTogglePin={onTogglePin} />,
    );

    expect(getByLabelText('Unpin shift')).toBeTruthy();
    expect(queryByLabelText('Pin shift')).toBeNull();
  });

  it('calls onTogglePin with the shift when the pin button is pressed', () => {
    const onTogglePin = jest.fn();
    const shift = { ...baseShift, pinned: false };
    const { getByLabelText } = render(
      <ShiftCard shift={shift} colors={COLORS} onTogglePin={onTogglePin} />,
    );

    fireEvent.press(getByLabelText('Pin shift'));

    expect(onTogglePin).toHaveBeenCalledTimes(1);
    expect(onTogglePin).toHaveBeenCalledWith(shift);
  });

  it('calls onTogglePin again to unpin an already pinned shift', () => {
    const onTogglePin = jest.fn();
    const shift = { ...baseShift, pinned: true };
    const { getByLabelText } = render(
      <ShiftCard shift={shift} colors={COLORS} onTogglePin={onTogglePin} />,
    );

    fireEvent.press(getByLabelText('Unpin shift'));

    expect(onTogglePin).toHaveBeenCalledTimes(1);
    expect(onTogglePin).toHaveBeenCalledWith(shift);
  });
});
