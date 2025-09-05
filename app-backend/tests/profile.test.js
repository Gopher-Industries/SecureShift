import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
// Self-contained mock for auth middleware (do not reference outer-scope jwt)
jest.mock('../src/middleware/auth.js', () => ({
  __esModule: true,
  default: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];

    if (token === 'valid-token') {
      req.user = { id: 'user123', role: 'guard' };
    } else {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
  },
}));

describe('Profile API', () => {
  let mockUser, mockToken;

  beforeAll(() => {
    // Set up a mock user and token for testing
    mockUser = { 
      id: 'user123', 
      role: 'guard', 
      name: 'Test User', 
      email: 'test@example.com' 
    };

  // Use a deterministic token string recognized by the mock above
  mockToken = 'valid-token';
  });

  // Clear all mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('GET /api/v1/users/me (View My Profile)', () => {
    it('should retrieve the authenticated user\'s profile and return 200', async () => {
      // Mock the User.findById call
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
        }),
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(mockUser.id);
      expect(res.body.name).toBe(mockUser.name);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const res = await request(app).get('/api/v1/users/me');
      
      // This test assumes the controller or auth middleware correctly handles missing tokens.
      // The controller should be updated to return 401 if req.user is not present.
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should return 401 Unauthorized if the token is invalid', async () => {
        const res = await request(app)
          .get('/api/v1/users/me')
          .set('Authorization', 'Bearer invalid-token');
  
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Unauthorized');
    });

    it('should return 200 with a null body if the user ID in the token does not exist', async () => {
      // Mock User.findById to find no user
      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toBe(null);
    });
  });

  describe('PUT /api/v1/users/me (Update My Profile)', () => {
    it('should update the user\'s profile with valid data and return 200', async () => {
      const updateData = { name: 'Updated Name', phone: '1234567890' };
      const updatedUser = { _id: mockUser.id, name: 'Updated Name', phone: '1234567890' };

      // Mock findByIdAndUpdate to return the updated user
      jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedUser),
      });

      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.phone).toBe('1234567890');
    });

    it('should not allow updating of protected fields like role', async () => {
      const updateData = { name: 'New Name', role: 'admin' }; // Attempt to escalate role
      const originalUser = { _id: mockUser.id, name: 'New Name', role: 'guard' };

      // The controller logic deletes the 'role' field, so we expect it not to be in the update call
      const findByIdAndUpdateMock = jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
        select: jest.fn().mockResolvedValue(originalUser),
      });

      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      // Check that findByIdAndUpdate was called without the role field
      expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
        mockUser.id,
        { name: 'New Name' }, // 'role' should be stripped by the controller
        expect.any(Object)
      );
      // The returned user should still have the original role
      expect(res.body.role).toBe('guard');
    });

    it('should return 200 with a null body if the user to update does not exist', async () => {
        // Mock findByIdAndUpdate to return null
        jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
            select: jest.fn().mockResolvedValue(null),
        });
  
        const res = await request(app)
          .put('/api/v1/users/me')
          .set('Authorization', `Bearer ${mockToken}`)
          .send({ name: 'Does not matter' });
  
        expect(res.status).toBe(200);
        expect(res.body).toBe(null);
      });
  });
});
