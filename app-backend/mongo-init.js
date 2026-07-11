db = db.getSiblingDB('secureshift_local');

db.createUser({
  user: "secureshift_app",
  pwd: "secureshift_app_password",
  roles: [
    {
      role: "readWrite",
      db: "secureshift_local"
    }
  ]
});
