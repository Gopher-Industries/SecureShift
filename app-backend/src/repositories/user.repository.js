import User from '../models/User.js';

class UserRepository {
  async findById(userId) {
    return User.findById(userId);
  }

  async findByIdWithoutPassword(userId) {
    return User.findById(userId).select('-password');
  }

  async findAllWithoutPassword() {
    return User.find().select('-password');
  }

  async updateByIdWithoutPassword(userId, fieldsToUpdate) {
    return User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    }).select('-password');
  }

  async deleteById(userId) {
    return User.findByIdAndDelete(userId);
  }

  async findGuardsWithoutPassword() {
    return User.find({ role: 'guard' }).select('-password');
  }

  async save(user) {
    return user.save();
  }

  async findEmployerFavourites(userId) {
    return User.findById(userId).populate('favourites', '-password');
  }
}

export default UserRepository;