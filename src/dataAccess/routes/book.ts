import * as express from "express";
import * as fs from "fs";
import validateUser from "../../helpers/validateUser";
import BookType from "../../types/bookType";
const router = express.Router();
import * as mysql from "mysql";

//DB connection object
import sql from "../../helpers/sql_db";
import { EROFS } from "node:constants";

router.post("/new", async (req: express.Request, res: express.Response) => {
  let isbn: string;
  let base64IMGFull: string;
  let type: string;
  let base64Short: string;
  let randomstring: string;
  let filename: string;

  try {
    isbn = req.body.book.isbn;
    base64IMGFull = req.body.base64;

    type = "." + base64IMGFull.substr(11, 3);

    base64Short = base64IMGFull.substr(22);

    const buff = Buffer.from(base64Short, "base64");

    randomstring = await require("crypto").randomBytes(16).toString("hex");

    filename = isbn + randomstring + type;
    fs.writeFileSync("../public_html/static/media/" + filename, buff);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }

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
    if (transactionErr) return res.sendStatus(500);

    let fk_genre: number;
    let fk_format: number;
    let fk_file: number;

    const getGenreSQL: string = "SELCET id_genre FROM genre WHERE name = ?";
    sql.query(
      getGenreSQL,
      [insertBook.genre],
      (getGenreError: mysql.MysqlError, genreResults: Array<any>) => {
        if (getGenreError) return res.send(getGenreError);
        if (genreResults.length === 0) return res.sendStatus(404);
        fk_genre = genreResults[0].id_genre;

        const getFormatSQL: string =
          "SELCET id_format FROM format WHERE name = ?";
        sql.query(
          getFormatSQL,
          [insertBook.genre],
          (getFromatError: mysql.MysqlError, formatResults: Array<any>) => {
            console.log("get format");
            if (getFromatError) return res.sendStatus(500);

            if (genreResults.length === 0) return res.sendStatus(404);

            fk_format = formatResults[0].id_format;

            const insertFileSQL: string =
              "INSERT INTO file (name, path) VALUES (?, ?)";
            sql.query(
              insertFileSQL,
              [],
              (
                insertFileError: mysql.MysqlError,
                insertFileResults: Array<any>
              ) => {
                if (insertFileError) {
                  sql.rollback();
                  return res.sendStatus(500);
                }
                fk_file = insertFileResults[0].insertId;

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
                  (
                    insertBookError: mysql.MysqlError,
                    insertBookResults: Array<any>
                  ) => {
                    if (insertBookError) {
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
      }
    );
  });
});

export default router;
