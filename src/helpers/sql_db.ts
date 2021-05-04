import * as mysql from "mysql";

var sql: mysql.Connection;

const handleDisconnect = () => {
  sql = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  sql.connect((err: mysql.MysqlError) => {
    if (err) {
      console.log("Error when connecting to DB:", err.message);
      console.log("Trying to reconnect...");
      setTimeout(handleDisconnect, 2000);
      return;
    }
    console.log(`Connected to MySQL-Server`);
    console.log(`DB-Name: ${process.env.DB_NAME}`);
  });

  sql.on("error", (err) => {
    console.log("db error", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      handleDisconnect();
    } else {
      console.log(
        err.message,
        err.code,
        new Date(Date.now()).toDateString(),
        new Date(Date.now()).toTimeString()
      );
    }
  });
};

handleDisconnect();

export default sql;
