import { ACTIONS } from '../middleware/logger.js';
import AppError from '../utils/AppError.js';

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  sanitizeProfileUpdatePayload(payload = {}) {
    const fieldsToUpdate = { ...payload };
    delete fieldsToUpdate.role;
    delete fieldsToUpdate.password;
    return fieldsToUpdate;
  }

  sanitizeAdminProfileUpdatePayload(payload = {}) {
    const fieldsToUpdate = { ...payload };
    delete fieldsToUpdate.password;
    return fieldsToUpdate;
  }

  async getMyProfile(userId) {
    const user = await this.userRepository.findByIdWithoutPassword(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async listUsers() {
    const users = await this.userRepository.findAllWithoutPassword();
    return {
      total: users.length,
      users,
    };
  }

  async updateMyProfile(userId, payload) {
    const fieldsToUpdate = this.sanitizeProfileUpdatePayload(payload);

    const updatedUser = await this.userRepository.updateByIdWithoutPassword(
      userId,
      fieldsToUpdate
    );

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    return updatedUser;
  }

  async adminGetUserProfile(targetUserId) {
    const user = await this.userRepository.findByIdWithoutPassword(targetUserId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async adminUpdateUserProfile(actorUserId, targetUserId, payload, auditLogger) {
    const fieldsToUpdate = this.sanitizeAdminProfileUpdatePayload(payload);

    const updatedUser = await this.userRepository.updateByIdWithoutPassword(
      targetUserId,
      fieldsToUpdate
    );

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    if (auditLogger?.log) {
      await auditLogger.log(actorUserId, ACTIONS.PROFILE_UPDATED, {
        updatedUserId: targetUserId,
        updatedFields: Object.keys(fieldsToUpdate),
      });
    }

    return updatedUser;
  }

  async getAllGuards() {
    return this.userRepository.findGuardsWithoutPassword();
  }

  async deleteUser(actorUserId, targetUserId, auditLogger) {
    const user = await this.userRepository.deleteById(targetUserId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (auditLogger?.log) {
      await auditLogger.log(actorUserId, ACTIONS.USER_DELETED, {
        deletedUserId: targetUserId,
        deletedUserEmail: user.email,
      });
    }

    return { message: 'User deleted successfully' };
  }

  async getEmployerProfile(currentUser) {
    if (currentUser.role !== 'employer') {
      throw new AppError('Access denied.', 403);
    }

    const employer = await this.userRepository.findByIdWithoutPassword(
      currentUser.id
    );

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    return employer;
  }

  async updateEmployerProfile(currentUser, payload) {
    if (currentUser.role !== 'employer') {
      throw new AppError('Access denied.', 403);
    }

    const fieldsToUpdate = this.sanitizeProfileUpdatePayload(payload);

    const updatedEmployer = await this.userRepository.updateByIdWithoutPassword(
      currentUser.id,
      fieldsToUpdate
    );

    if (!updatedEmployer) {
      throw new AppError('Employer not found', 404);
    }

    return updatedEmployer;
  }

  async registerPushToken(userId, payload) {
    const { token, platform, deviceId } = payload;

    if (!token || typeof token !== 'string') {
      throw new AppError('Push token is required.', 400);
    }

    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const existing = user.pushTokens?.find((item) => item.token === token);

    if (existing) {
      existing.platform = platform ?? existing.platform;
      existing.deviceId = deviceId ?? existing.deviceId;
      existing.updatedAt = new Date();
    } else {
      user.pushTokens = [
        ...(user.pushTokens ?? []),
        {
          token,
          platform,
          deviceId,
          updatedAt: new Date(),
        },
      ];
    }

    await this.userRepository.save(user);

    return { message: 'Push token registered.' };
  }

  async addFavouriteGuard(currentUser, guardId) {
    if (currentUser.role !== 'employer') {
      throw new AppError('Only employers can favourite guards.', 403);
    }

    const guard = await this.userRepository.findById(guardId);

    if (!guard || guard.role !== 'guard') {
      throw new AppError('Guard not found', 404);
    }

    const employer = await this.userRepository.findById(currentUser.id);

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    const alreadyExists = employer.favourites.some(
      (id) => id.toString() === guardId
    );

    if (!alreadyExists) {
      employer.favourites.push(guardId);
      await this.userRepository.save(employer);
    }

    return {
      message: 'Guard added to favourites',
      favourites: employer.favourites,
    };
  }

  async removeFavouriteGuard(currentUser, guardId) {
    if (currentUser.role !== 'employer') {
      throw new AppError('Only employers can modify favourites.', 403);
    }

    const employer = await this.userRepository.findById(currentUser.id);

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    employer.favourites = employer.favourites.filter(
      (id) => id.toString() !== guardId
    );

    await this.userRepository.save(employer);

    return {
      message: 'Guard removed from favourites',
      favourites: employer.favourites,
    };
  }

  async getFavouriteGuards(currentUser) {
    if (currentUser.role !== 'employer') {
      throw new AppError('Only employers can view favourites.', 403);
    }

    const employer = await this.userRepository.findEmployerFavourites(
      currentUser.id
    );

    if (!employer) {
      throw new AppError('Employer not found', 404);
    }

    return employer.favourites;
  }
}

export default UserService;