// Example test structure
describe('Notification Creation', () => {
  it('should automatically set createdBy to authenticated user', async () => {
    const user = await createTestUser();
    const req = {
      user: { _id: user._id, role: 'admin' },
      body: {
        userId: someUserId,
        type: 'SHIFT_APPROVED',
        message: 'Test notification'
      }
    };
    const res = mockResponse();

    await createNotification(req, res);

    const notification = await Notification.findOne({ message: 'Test notification' });
    expect(notification.createdBy.toString()).toBe(user._id.toString());
  });

  it('should not allow spoofing createdBy from request body', async () => {
    const user = await createTestUser();
    const maliciousUserId = new mongoose.Types.ObjectId();

    const req = {
      user: { _id: user._id, role: 'admin' },
      body: {
        userId: someUserId,
        type: 'SHIFT_APPROVED',
        message: 'Test notification',
        createdBy: maliciousUserId // Attempt to spoof
      }
    };

    await createNotification(req, res);

    const notification = await Notification.findOne({ message: 'Test notification' });
    // Should ignore the spoofed ID and use authenticated user
    expect(notification.createdBy.toString()).toBe(user._id.toString());
    expect(notification.createdBy.toString()).not.toBe(maliciousUserId.toString());
  });

  it('should require createdBy in schema', async () => {
    // Test that notification without createdBy fails validation
    const notification = new Notification({
      userId: someUserId,
      type: 'SHIFT_APPROVED',
      message: 'Test'
      // No createdBy
    });
    await expect(notification.save()).rejects.toThrow();
  });
});