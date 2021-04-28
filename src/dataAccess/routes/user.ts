import * as express from "express";
import axios from "axios";
const router = express.Router();
import BookType from "../../types/bookType";
import UserType from "../../types/userType";
import * as mysql from "mysql";

//DB connection object
import sql from "../../helpers/sql_db";

//get user by username parameter
router.get("/:username", (req: express.Request, res: express.Response) => {});

//post new user with recaptcha validation
router.post("/new", async (req: express.Request, res: express.Response) => {
  const reCaptchaToken = req.body.reCaptchaToken;

  const user: UserType = req.body.user;

  let fk_location: number;
  let fk_name: number;

  //google recaptcha
  const googleRes = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${reCaptchaToken}`
  );
  if (!googleRes.data.success) return res.sendStatus(401);

  //insert adress
  const locationSQL =
    "INSERT INTO address (street, number, zip, city, state, country) VALUES (?, ?, ?, ?, ?, ?)";
  const adress: mysql.Query = await sql.query(
    locationSQL,
    [
      user.location.street,
      user.location.number,
      user.location.zipCode,
      user.location.city,
      user.location.state,
      user.location.country,
    ],
    async (err: mysql.MysqlError, results: any, fields: mysql.FieldInfo[]) => {
      if (err) return res.sendStatus(500);
      fk_location = results.insertId;
    }
  );

  //name insert
  const nameSQL = "INSERT INTO name (firstname, lastname) VALUES (?, ?)";
  await sql.query(
    nameSQL,
    [user.name.firstName, user.name.lastName],
    async (err: mysql.MysqlError, results: any, fields: mysql.FieldInfo[]) => {
      if (err) return res.sendStatus(500);
      fk_name = results.insertId;
    }
  );

  //user insert
  const userSQL =
    "INSERT INTO user (username, password, email, salt, is_admin, fk_name, fk_adress) VALUES (?, ?, ?, ?, ?, ?, ?)";
  await sql.query(
    userSQL,
    [],
    async (err: mysql.MysqlError, results: any, fields: mysql.FieldInfo[]) => {}
  );
  return res.sendStatus(200);
});

export default router;
