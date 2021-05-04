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
    if (!req.body.user.is_admin)
      return res.status(403).send("Your are not a admin User");

    const username: string = req.params.username;

    const checkUserSQL: string = "SELECT * FROM user WHERE username = ?";

    sql.query(
      checkUserSQL,
      [username],
      (checkUserErr: mysql.MysqlError, checkUserResults: any) => {
        if (checkUserErr)
          return res
            .status(500)
            .send("Something went wrong while searching for your user");
        if (checkUserResults.length === 0)
          return res.status(404).send("User not found");

        const findUserSQL: string =
          "SELECT username, email, is_admin, street, number, zip, city, state, country, firstName, lastName from buchfix_db.user INNER JOIN address ON user.fk_address=address.id_address INNER JOIN name ON user.fk_name=name.id_name WHERE username = ?";

        sql.query(
          findUserSQL,
          [username],
          (findUserErr: mysql.MysqlError, findUserResults: Array<any>) => {
            if (findUserErr)
              return res
                .status(500)
                .send("Something went wrong while processing your Data");

            if (findUserResults.length === 0)
              return res.status(404).send("User not found");

            const user: UserType = {
              username: findUserResults[0].username,
              email: findUserResults[0].email,
              is_admin: findUserResults[0].is_admin,
              name: {
                firstName: findUserResults[0].firstName,
                lastName: findUserResults[0].lastName,
              },
              location: {
                city: findUserResults[0].city,
                country: findUserResults[0].country,
                number: findUserResults[0].number,
                state: findUserResults[0].state,
                street: findUserResults[0].street,
                zipCode: findUserResults[0].zip,
              },
            };

            res.status(200).send(user);
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
      if (req.body.user.username !== username)
        return res.status(403).send("You are not allowed to change this user");
    }

    sql.beginTransaction((transactionErr: mysql.MysqlError) => {
      const findUserSQL: string = "SELECT * from user where username = ?";
      sql.query(
        findUserSQL,
        [username],
        (findUserError: mysql.MysqlError, results: any) => {
          if (findUserError) {
            sql.rollback();
            return res
              .status(500)
              .send("Something went wrong while searching for your user");
          }
          if (results.length === 0)
            return res.status(404).send("User not found");

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
                return res
                  .status(500)
                  .send("Something went wrong while processing your Data");
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
                    return res
                      .status(500)
                      .send("Something went wrong while processing your Data");
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
