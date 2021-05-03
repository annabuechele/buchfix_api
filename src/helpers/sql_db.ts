import * as mysql from "mysql";

const sql = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

sql.connect(function (err: mysql.MysqlError) {
  if (err) return console.log(err.message);
  console.log(`Connected to MySQL-Server`);
  console.log(`DB-Name: ${process.env.DB_NAME}`);
});

sql.on("error", (err: mysql.MysqlError) => {
  console.log(
    err.message,
    err.code,
    new Date(Date.now()).toDateString(),
    new Date(Date.now()).toTimeString()
  );
});

export default sql;
