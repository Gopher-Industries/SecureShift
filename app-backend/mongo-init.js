db = db.getSiblingDB('secure_db');

db.createUser({
  user: "admin",
  pwd: "adminpass",
  roles: [
    {
      role: "readWrite",
      db: "secure_db"
    }
  ]
});
