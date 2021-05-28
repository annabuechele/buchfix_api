import * as express from "express";
import * as fs from "fs";
import validateUser from "../../helpers/validateUser";
import BookType from "../../types/bookType";
const router = express.Router();
import * as mysql from "mysql";

//DB connection object
import sql from "../../helpers/sql_db";
import UserType from "../../types/userType";

//donate / insert book (depends if user is admin or not)
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
    const insertBook: BookType = {
      format: req.body.book.format,
      genre: req.body.book.genre,
      isbn: isbn,
      path: "/static/media/",
      file_name: filename,
      sites: req.body.book.sites,
      title: req.body.book.title,
    };
    sql.beginTransaction((transactionErr: mysql.MysqlError) => {
      if (transactionErr) return res.status(500).send("Something went wrong");

      let fk_genre: number;
      let fk_format: number;
      let fk_file: number;
      const accepted: "a" | "w" | "d" = req.body.user.is_admin ? "a" : "w";

      const getGenreSQL: string =
        "SELECT id_genre FROM genre WHERE genre_name = ?";
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
            "SELECT id_format FROM format WHERE format_name = ?";
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
                "INSERT INTO file (file_name, path) VALUES (?, ?)";
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
//find book by isbn
router.get(
  "/findbyisbn/:isbn",
  validateUser,
  (req: express.Request, res: express.Response) => {
    const isbn = req.params.isbn;

    const findBookSQL =
      "SELECT isbn, title, sites, format_name, genre_name, file_name, path from book INNER JOIN format ON book.fk_format=format.id_format INNER JOIN genre ON book.fk_genre=genre.id_genre INNER JOIN file ON book.fk_file=file.id_file WHERE isbn=?";

    sql.query(
      findBookSQL,
      [isbn],
      (findBookError: mysql.MysqlError, findBookResults: any) => {
        console.log(findBookError);
        if (findBookError)
          res.status(500).send("There was an error while processing your Data");

        if (findBookResults.length == 0)
          return res.status(404).send("No books found with this ISBN");

        const resultBook: BookType = {
          format: findBookResults[0].format_name,
          genre: findBookResults[0].genre_name,
          isbn: findBookResults[0].isbn,
          path:
            process.env.PAGE_URL +
            findBookResults[0].path +
            findBookResults[0].file_name,
          sites: findBookResults[0].sites,
          title: findBookResults[0].title,
        };

        const bookAvaibableSQL =
          "SELECT * from user_donates_book WHERE fk_book=? AND accepted='a'";

        sql.query(
          bookAvaibableSQL,
          [resultBook.isbn],
          (bookAvaibableError: mysql.MysqlError, bookAvaibableResults: any) => {
            if (bookAvaibableError)
              res
                .status(500)
                .send("There was an error while processing your Data");
            if (bookAvaibableResults.length == 0)
              return res
                .status(404)
                .send("No book is currently not avaivable!");
            res.send(resultBook);
          }
        );
      }
    );
  }
);
//query results for searchbar
router.get(
  "/getsearchresult",
  validateUser,
  (req: express.Request, res: express.Response) => {
    let queryItems: any = Number(req.query.queryItems);
    const queryString = req.query.queryString;

    if (typeof queryItems === "string" || !queryItems) queryItems = 5;

    if (!queryString) return res.sendStatus(400);

    if (queryString.length < 3) return res.sendStatus(400);

    const findBooksSQL: string =
      "SELECT isbn, title from book INNER JOIN user_donates_book ON user_donates_book.fk_book=book.isbn  WHERE title LIKE " +
      sql.escape("%" + queryString + "%") +
      "AND accepted='a' ORDER BY title ASC LIMIT ?";
    //escaping mysql package bugs be like
    sql.query(
      findBooksSQL,
      [queryItems],
      (findBookError: mysql.MysqlError, findBookResults: any) => {
        if (findBookError)
          res.status(500).send("There was an error while processing your Data");
        if (findBookResults.length === 0)
          return res.status(400).send("No books found with these parameters!");
        res.send(findBookResults);
      }
    );
  }
);

//get newest book inserted
router.get(
  "/newest",
  validateUser,
  (req: express.Request, res: express.Response) => {
    let resultsQuery: any = Number(req.query.results);
    if (!resultsQuery) resultsQuery = 5;

    const findBooksSQL: string =
      "SELECT isbn, title, file_name from book INNER JOIN user_donates_book ON user_donates_book.fk_book=book.isbn INNER JOIN file ON book.fk_file=id_file WHERE accepted='a' ORDER BY donated_at ASC LIMIT ?";

    sql.query(
      findBooksSQL,
      [resultsQuery],
      (findBookError: mysql.MysqlError, findBookResults: any) => {
        console.log(findBookError);
        if (findBookError)
          res
            .status(500)
            .send("Something went wrong while processing your data!");

        res.status(200).send(findBookResults);
      }
    );
  }
);

//get all genres
router.get(
  "/genres",
  validateUser,
  (req: express.Request, res: express.Response) => {
    const getGenresSQL = "SELECT genre_name from genre";

    sql.query(
      getGenresSQL,
      (getGenreError: mysql.MysqlError, getGenreResults: any) => {
        if (getGenreError)
          res
            .status(500)
            .send("Something went wrong while processing your data!");
        res.status(200).send(getGenreResults);
      }
    );
  }
);

//get all genres
router.get(
  "/formats",
  validateUser,
  (req: express.Request, res: express.Response) => {
    const getGenresSQL = "SELECT format_name from format";

    sql.query(
      getGenresSQL,
      (getFormatError: mysql.MysqlError, getFormatResults: any) => {
        if (getFormatError)
          res
            .status(500)
            .send("Something went wrong while processing your data!");
        res.status(200).send(getFormatResults);
      }
    );
  }
);

//delete book by
router.delete(
  "/deletebook/:isbn",
  validateUser,
  (req: express.Request, res: express.Response) => {
    console.log(req.body.user);
    if (req.body.user.id_admin === 0)
      return res.status(403).send("You are not allowed to delete books");
    res.sendStatus(200);
  }
);

export default router;
