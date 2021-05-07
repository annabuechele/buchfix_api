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
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];

  if (accessToken == null)
    return res.status(401).send("Accesstoken not provided");

  jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET,
    (err: jwt.VerifyErrors, jwtUser: UserLoginType) => {
      if (err)
        return res
          .status(401)
          .send("There was an error while processing your Token");

      const loginUser: UserLoginType = {
        username: jwtUser.username,
        password: jwtUser.password,
      };

      //find user in DB
      const findSaltSQL: string = "SELECT salt from user WHERE username = ?";
      sql.query(
        findSaltSQL,
        [loginUser.username],
        async (saltError: mysql.MysqlError, saltResults: Array<any>) => {
          if (saltError)
            return res
              .status(500)
              .send("Something went wrong while processing your Data");

          if (saltResults.length === 0)
            return res.status(404).send("User not found");

          const salt: string = saltResults[0].salt;
          const userSQL: string =
            "SELECT id_user, username, email, is_admin, street, number, zip, city, state, country, firstName, lastName from buchfix_db.user INNER JOIN address ON user.fk_address=address.id_address INNER JOIN name ON user.fk_name=name.id_name WHERE username = ? AND password = SHA1(?) ";

          sql.query(
            userSQL,
            [loginUser.username, loginUser.password + salt],
            (userError: mysql.MysqlError, userResults: Array<any>) => {
              if (userError)
                return res
                  .status(500)
                  .send("Something went wrong while processing your Data");

              if (userResults.length === 0) return res.send(403);

              const user: UserType = {
                id: userResults[0].id_user,
                username: userResults[0].username,
                email: userResults[0].email,
                is_admin: userResults[0].is_admin,
                name: {
                  firstName: userResults[0].firstName,
                  lastName: userResults[0].lastName,
                },
                location: {
                  city: userResults[0].city,
                  country: userResults[0].country,
                  number: userResults[0].number,
                  state: userResults[0].state,
                  street: userResults[0].street,
                  zipCode: userResults[0].zip,
                },
              };

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
