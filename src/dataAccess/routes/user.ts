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

  let fk_address: number;
  let fk_name: number;

  //google recaptcha
  const googleRes = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${reCaptchaToken}`
  );
  if (!googleRes.data.success) return res.sendStatus(401);

  sql.beginTransaction((err: mysql.MysqlError) => {
    //insert adress
    const locationSQL =
      "INSERT INTO address (street, number, zip, city, state, country) VALUES (?, ?, ?, ?, ?, ?)";
    sql.query(
      locationSQL,
      [
        user.location.street,
        user.location.number,
        user.location.zipCode,
        user.location.city,
        user.location.state,
        user.location.country,
      ],
      async (
        locationErr: mysql.MysqlError,
        locationResults: any,
        locationFields: mysql.FieldInfo[]
      ) => {
        if (locationErr) {
          sql.rollback();
          return res.sendStatus(500);
        }

        fk_address = locationResults.insertId;

        //name insert
        const nameSQL = "INSERT INTO name (firstname, lastname) VALUES (?, ?)";
        sql.query(
          nameSQL,
          [user.name.firstName, user.name.lastName],
          async (
            nameErr: mysql.MysqlError,
            nameResults: any,
            nameFields: mysql.FieldInfo[]
          ) => {
            if (nameErr) {
              sql.rollback();
              return res.sendStatus(500);
            }

            fk_name = nameResults.insertId;
            const salt = await require("crypto")
              .randomBytes(16)
              .toString("hex");

            //user insert
            const userSQL =
              "INSERT INTO user (username, password, email, salt, is_admin, fk_name, fk_address) VALUES (?, Password(?), ?, ?, ?, ?, ?)";
            sql.query(
              userSQL,
              [
                user.username,
                user.password + salt,
                user.email,
                salt,
                0,
                fk_name,
                fk_address,
              ],
              async (
                userErr: mysql.MysqlError,
                userResults: any,
                userFields: mysql.FieldInfo[]
              ) => {
                if (userErr) {
                  sql.rollback();
                  return res.sendStatus(500);
                }
                sql.commit((commitError: mysql.MysqlError) => {
                  if (commitError) return res.sendStatus(500);
                  res.sendStatus(200);
                });
              }
            );
          }
        );
      }
    );
  });
});

export default router;
