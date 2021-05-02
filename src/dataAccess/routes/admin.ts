import * as express from "express";
import * as mysql from "mysql";
import validateUser from "../../helpers/validateUser";

const router = express();

//db connection
import sql from "../../helpers/sql_db";

//types
import UserType from "../../types/userType";

//get user by username parameter
router.get(
  "/:username",
  validateUser,
  (req: express.Request, res: express.Response) => {
    if (!req.body.user.is_admin) return res.sendStatus(403);

    const username: string = req.params.username;

    const userSQL: string = "SELECT * FROM user WHERE username = ?";
    sql.query(
      userSQL,
      [username],
      (err: mysql.MysqlError, userResults: any) => {
        if (userResults.length === 0) return res.sendStatus(404);

        const userSQL: string =
          "SELECT username, email, is_admin, street, number, zip, city, state, country, firstName, lastName from buchfix_db.user INNER JOIN address ON user.fk_address=address.id_address INNER JOIN name ON user.fk_name=name.id_name WHERE username = ?";

        sql.query(
          userSQL,
          [username],
          (err: mysql.MysqlError, userResults: Array<any>) => {
            if (err) return res.sendStatus(500);

            if (userResults.length === 0) return res.send(403);

            const user: UserType = {
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

            res.send(user);
          }
        );
      }
    );
  }
);

export default router;
