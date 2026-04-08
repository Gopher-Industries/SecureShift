import UserController from '../controllers/user.controller.js';
import UserRepository from '../repositories/user.repository.js';
import UserService from '../services/user.service.js';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

export default userController;