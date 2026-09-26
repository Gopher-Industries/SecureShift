import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../theme/renderWithTheme';
import { MemoryRouter } from 'react-router-dom';
import Employers from './Employers';
import { getUsers } from '../service/adminAPI';

jest.mock('../service/adminAPI', () => ({
  getUsers: jest.fn(),
}));

const mockGetUsers = getUsers;

describe('Employers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads employers using the employer role and pagination', async () => {
    mockGetUsers
      .mockResolvedValueOnce({
        users: [
          {
            _id: 'emp-1',
            name: 'John Employer',
            email: 'john@example.com',
            role: 'employer',
          },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        users: [
          {
            _id: 'emp-2',
            name: 'Jane Employer',
            email: 'jane@example.com',
            role: 'employer',
          },
        ],
        total: 2,
        page: 2,
        limit: 20,
        totalPages: 2,
      });

    renderWithTheme(
      <MemoryRouter>
        <Employers />
      </MemoryRouter>
    );

    expect(await screen.findByText('John Employer')).toBeInTheDocument();
    expect(await screen.findByText('Jane Employer')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledTimes(2);
      expect(mockGetUsers).toHaveBeenNthCalledWith(1, {
        role: 'employer',
        page: 1,
        limit: 20,
      });
      expect(mockGetUsers).toHaveBeenNthCalledWith(2, {
        role: 'employer',
        page: 2,
        limit: 20,
      });
    });
  });
});
