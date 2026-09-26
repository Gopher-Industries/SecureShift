import { screen } from '@testing-library/react';
import { renderWithTheme } from '../theme/renderWithTheme';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EmployerDetails from './EmployerDetails';
import { getUser, getShifts } from '../service/adminAPI';

jest.mock('../service/adminAPI', () => ({
  getUser: jest.fn(),
  getShifts: jest.fn(),
}));

const mockGetUser = getUser;
const mockGetShifts = getShifts;

describe('EmployerDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows shifts when createdBy is a populated object', async () => {
    mockGetUser.mockResolvedValue({
      user: {
        _id: 'emp-123',
        name: 'John Employer',
        email: 'john@example.com',
        role: 'employer',
      },
    });

    mockGetShifts.mockResolvedValue({
      shifts: [
        {
          _id: 'shift-1',
          title: 'Morning Security',
          date: '2026-09-20',
          startTime: '08:00',
          endTime: '16:00',
          status: 'open',
          createdBy: {
            _id: 'emp-123',
          },
        },
      ],
    });

    renderWithTheme(
      <MemoryRouter initialEntries={['/employers/emp-123']}>
        <Routes>
          <Route path="/employers/:id" element={<EmployerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('John Employer')).toBeInTheDocument();
    expect(await screen.findByText('Morning Security')).toBeInTheDocument();
  });

  it('shows shifts when createdBy is a raw id', async () => {
    mockGetUser.mockResolvedValue({
      user: {
        _id: 'emp-123',
        name: 'John Employer',
        email: 'john@example.com',
        role: 'employer',
      },
    });

    mockGetShifts.mockResolvedValue({
      shifts: [
        {
          _id: 'shift-2',
          title: 'Night Security',
          date: '2026-09-20',
          startTime: '22:00',
          endTime: '06:00',
          status: 'open',
          createdBy: 'emp-123',
        },
      ],
    });

    renderWithTheme(
      <MemoryRouter initialEntries={['/employers/emp-123']}>
        <Routes>
          <Route path="/employers/:id" element={<EmployerDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('John Employer')).toBeInTheDocument();
    expect(await screen.findByText('Night Security')).toBeInTheDocument();
  });
});
