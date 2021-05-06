import * as express from "express";
import * as fs from "fs";
import validateUser from "../../helpers/validateUser";
import BookType from "../../types/bookType";
const router = express.Router();
import * as mysql from "mysql";

//DB connection object
import sql from "../../helpers/sql_db";
import UserType from "../../types/userType";

router.post(
  "/new",
  validateUser,
  async (req: express.Request, res: express.Response) => {
    console.log("book");
    const isbn: string = req.body.book.isbn;
    const base64IMGFull: string = req.body.base64;

    const type: string = "." + base64IMGFull.trim().substr(11, 3);
    console.log(type);

    if (type !== ".png")
      if (type !== ".jpg")
        if (type !== ".gif")
          return res.status(500).send("Error with your File/Filename");

    const base64Short: string = base64IMGFull.substr(22);

    const randomstring: string = await require("crypto")
      .randomBytes(8)
      .toString("hex");

    const filename: string = isbn + "_" + randomstring + type;

    const buff = Buffer.from(base64Short, "base64");
    console.log(filename);
    const insertBook: BookType = {
      format: req.body.book.format,
      genre: req.body.book.genre,
      isbn: isbn,
      path: "/static/media/",
      file_name: filename,
      sites: req.body.book.sites,
      title: req.body.book.title,
    };
    console.log(insertBook);
    sql.beginTransaction((transactionErr: mysql.MysqlError) => {
      console.log(transactionErr);
      if (transactionErr) return res.status(500).send("Something went wrong");

      let fk_genre: number;
      let fk_format: number;
      let fk_file: number;
      const accepted: "a" | "w" | "d" = req.body.user.is_admin ? "a" : "w";

      const getGenreSQL: string = "SELECT id_genre FROM genre WHERE name = ?";
      sql.query(
        getGenreSQL,
        [insertBook.genre],
        (getGenreError: mysql.MysqlError, genreResults: any) => {
          console.log(getGenreError);
          if (getGenreError)
            return res
              .status(500)
              .send("Something went wrong while processing your Data");
          if (genreResults.length === 0)
            return res.status(404).send("Genre not found");

          fk_genre = genreResults[0].id_genre;
          const getFormatSQL: string =
            "SELECT id_format FROM format WHERE name = ?";
          sql.query(
            getFormatSQL,
            [insertBook.format],
            (getFromatError: mysql.MysqlError, formatResults: Array<any>) => {
              console.log(getFromatError);
              if (getFromatError)
                return res
                  .status(500)
                  .send("Something went wrong while processing your Data");

              if (formatResults.length === 0)
                return res.status(404).send("Format not found");

              fk_format = formatResults[0].id_format;

              const insertFileSQL: string =
                "INSERT INTO file (name, path) VALUES (?, ?)";
              sql.query(
                insertFileSQL,
                [insertBook.file_name, insertBook.path],
                (insertFileError: mysql.MysqlError, insertFileResults: any) => {
                  console.log(insertFileError);
                  if (insertFileError) {
                    sql.rollback();
                    return res
                      .status(500)
                      .send("Something went wrong while processing your Data");
                  }

                  fk_file = insertFileResults.insertId;

                  const insertBookSQL: string =
                    "INSERT INTO book (isbn, title, sites, fk_format, fk_genre, fk_file) VALUES (?, ?, ?, ?, ?, ?)";
                  sql.query(
                    insertBookSQL,
                    [
                      insertBook.isbn,
                      insertBook.title,
                      insertBook.sites,
                      fk_format,
                      fk_genre,
                      fk_file,
                    ],
                    async (
                      insertBookError: mysql.MysqlError,
                      insertBookResults: any
                    ) => {
                      console.log(insertBookError);
                      if (insertBookError) {
                        sql.rollback();
                        return res
                          .status(500)
                          .send(
                            "Something went wrong while processing your Data"
                          );
                      }

                      const insertUserDonatedBookSQL: string =
                        "INSERT INTO user_donates_book (accepted, donated_at, fk_book, fk_user) VALUES (?, ?, ?, ?)";

                      sql.query(
                        insertUserDonatedBookSQL,
                        [
                          accepted,
                          new Date()
                            .toISOString()
                            .slice(0, 19)
                            .replace("T", " "),
                          insertBook.isbn,
                          req.body.user.id,
                        ],
                        (
                          insertUserDonatedBookError: mysql.MysqlError,
                          insertUserDonatedBookResults: any
                        ) => {
                          console.log(insertUserDonatedBookError);
                          if (insertUserDonatedBookError) {
                            sql.rollback();
                            return res
                              .status(500)
                              .send(
                                "Something went wrong while processing your Data"
                              );
                          }

                          try {
                            fs.writeFileSync(
                              "../public_html/static/media/" + filename,
                              buff
                            );
                          } catch (error) {
                            sql.rollback();
                            return res
                              .status(500)
                              .send(
                                "Something went wrong while processing your Data"
                              );
                          }

                          sql.commit();
                          res
                            .status(200)
                            .send(
                              "https://buchfix.at" +
                                insertBook.path +
                                insertBook.file_name
                            );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
);

router.post(
  "/findbyisbn/:isbn",
  validateUser,
  (req: express.Request, res: express.Response) => {
    const isbn = req.params.isbn;

    const findBookSQL = "SELECT * from";
  }
);

router.post(
  "/getsearchresult",
  validateUser,
  (req: express.Request, res: express.Response) => {
    let queryItems: any = Number(req.query.queryItems);
    const queryString = req.query.queryString;

    if (typeof queryItems === "string" || !queryItems) queryItems = 5;

    if (!queryString) return res.sendStatus(400);

    if (queryString.length < 3) return res.sendStatus(400);

    const findBooksSQL: string =
      "SELECT isbn, title from book WHERE title LIKE " +
      sql.escape("%" + queryString + "%") +
      " ORDER BY title ASC LIMIT ?";
    //escaping mysql package bugs be like
    sql.query(
      findBooksSQL,
      [queryItems],
      (findBookError: mysql.MysqlError, findBookResults: any, fields) => {
        console.log(findBookResults);
        if (findBookError)
          res.status(500).send("There was an error while processing your Data");
        if (findBookResults.length === 0)
          return res.status(400).send("No books found with these parameters!");
        res.send(findBookResults);
      }
    );
  }
);

export default router;
