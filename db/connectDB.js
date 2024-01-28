import mysql from "mysql2/promise";

let db;

try {
  db = await mysql.createConnection(
    `mysql://root:password@localhost:3306/my_business`
  );
} catch (error) {
  console.log(error);
}

export default db;