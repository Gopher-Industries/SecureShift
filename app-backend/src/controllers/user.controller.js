class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  getMyProfile = async (req, res) => {
    try {
      const user = await this.userService.getMyProfile(req.user.id);
      return res.status(200).json(user);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  listUsers = async (req, res) => {
    try {
      const result = await this.userService.listUsers();
      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  updateMyProfile = async (req, res) => {
    try {
      const updatedUser = await this.userService.updateMyProfile(
        req.user.id,
        req.body
      );

      return res.status(200).json(updatedUser);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  adminGetUserProfile = async (req, res) => {
    try {
      const user = await this.userService.adminGetUserProfile(req.params.userId);
      return res.status(200).json(user);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  adminUpdateUserProfile = async (req, res) => {
    try {
      const updatedUser = await this.userService.adminUpdateUserProfile(
        req.user.id,
        req.params.userId,
        req.body,
        req.audit
      );

      return res.status(200).json(updatedUser);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  getAllGuards = async (req, res) => {
    try {
      const guards = await this.userService.getAllGuards();
      return res.status(200).json(guards);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  deleteUser = async (req, res) => {
    try {
      const result = await this.userService.deleteUser(
        req.user.id,
        req.params.userId,
        req.audit
      );

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  getEmployerProfile = async (req, res) => {
    try {
      const employer = await this.userService.getEmployerProfile(req.user);
      return res.status(200).json(employer);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  updateEmployerProfile = async (req, res) => {
    try {
      const updatedEmployer = await this.userService.updateEmployerProfile(
        req.user,
        req.body
      );

      return res.status(200).json(updatedEmployer);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  registerPushToken = async (req, res) => {
    try {
      const result = await this.userService.registerPushToken(
        req.user.id,
        req.body
      );

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  addFavouriteGuard = async (req, res) => {
    try {
      const result = await this.userService.addFavouriteGuard(
        req.user,
        req.params.guardId
      );

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  removeFavouriteGuard = async (req, res) => {
    try {
      const result = await this.userService.removeFavouriteGuard(
        req.user,
        req.params.guardId
      );

      return res.status(200).json(result);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };

  getFavouriteGuards = async (req, res) => {
    try {
      const favourites = await this.userService.getFavouriteGuards(req.user);
      return res.status(200).json(favourites);
    } catch (err) {
      return res
        .status(err.statusCode || 500)
        .json({ message: err.message });
    }
  };
}

export default UserController;