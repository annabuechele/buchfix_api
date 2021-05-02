import * as express from "express";
import * as mysql from "mysql";
import validateUser from "../../helpers/validateUser";

const router = express();

//db connection
import sql from "../../helpers/sql_db";

//types
import UserType from "../../types/userType";

//get user by username parameter
router.post(
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

router.post(
  "/update/:username",
  validateUser,
  (req: express.Request, res: express.Response) => {
    const username: string = req.params.username;

    if (!req.body.user.is_admin) {
      if (req.body.user.username !== username) return res.sendStatus(403);
    }

    sql.beginTransaction((transactionErr: mysql.MysqlError) => {
      const findUserSQL: string = "SELECT * from user where username = ?";
      sql.query(
        findUserSQL,
        [username],
        (findUserError: mysql.MysqlError, results: any) => {
          if (findUserError) {
            sql.rollback();
            return res.sendStatus(500);
          }
          if (results.length === 0) return res.sendStatus(404);

          const userToUpdate: UserType = req.body.updateData;

          userToUpdate.fk_address = results[0].fk_address;
          userToUpdate.fk_name = results[0].fk_name;

          const updateAddressSQL: string =
            "UPDATE address SET street = ?, number = ?, zip = ?, city = ?, state = ?, country = ? WHERE id_address = ?";
          sql.query(
            updateAddressSQL,
            [
              userToUpdate.location.street,
              userToUpdate.location.number,
              userToUpdate.location.zipCode,
              userToUpdate.location.city,
              userToUpdate.location.state,
              userToUpdate.location.country,
              userToUpdate.fk_address,
            ],
            (updateAddressError: mysql.MysqlError) => {
              if (updateAddressError) {
                sql.rollback();
                return res.sendStatus(500);
              }
              const updateNameSQL: string =
                "UPDATE name SET firstName = ?, lastName = ? WHERE id_name = ?";

              sql.query(
                updateNameSQL,
                [
                  userToUpdate.name.firstName,
                  userToUpdate.name.lastName,
                  userToUpdate.fk_name,
                ],
                (updateNameError: mysql.MysqlError) => {
                  if (updateNameError) {
                    sql.rollback();
                    return res.sendStatus(500);
                  }
                  sql.commit();
                  res.sendStatus(200);
                }
              );
            }
          );
        }
      );
    });
  }
);

export default router;
