import * as express from "express";
import * as jwt from "jsonwebtoken";
import * as mysql from "mysql";
//types
import UserLoginType from "../types/userLoginType";
import UserType from "../types/userType";
//db connection
import sql from "../helpers/sql_db";

const validateUser = (
  req: express.Request,
  res: express.Response,
  next: Function
) => {
  const accessToken = req.body.accessToken;

  if (accessToken == null) return res.sendStatus(401);

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    (err: jwt.VerifyErrors, jwtUser: UserLoginType) => {
      if (err) return res.sendStatus(401);

      const loginUser: UserLoginType = {
        username: jwtUser.username,
        password: jwtUser.password,
      };

      //find user in DB
      const findSaltSQL: string = "SELECT salt from user WHERE username = ?";
      sql.query(
        findSaltSQL,
        [loginUser.username],
        async (err: mysql.MysqlError, saltResults: Array<any>) => {
          if (err) return res.sendStatus(500);

          if (saltResults.length === 0) return res.sendStatus(403);

          const salt: string = saltResults[0].salt;

          const userSQL: string =
            "SELECT * from user WHERE username = ? AND password = Password(?)";

          sql.query(
            userSQL,
            [loginUser.username, loginUser.password + salt],
            (err: mysql.MysqlError, userResults: Array<any>) => {
              if (err) return res.sendStatus(500);

              if (userResults.length === 0) return res.send(403);

              const user: UserType = userResults[0];

              req.body.user = user;
              next();
            }
          );
        }
      );
    }
  );
};

export default validateUser;
