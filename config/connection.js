import mysql from "mysql2/promise";

let db;

try {
  const { DB_DATABASE, DB_USER, DB_PASSWORD } = process.env;

  db = await mysql.createConnection(
    `mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_DATABASE}`
  );
} catch (error) {
  console.log(error);
}

export default db;
