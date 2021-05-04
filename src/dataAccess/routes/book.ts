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
  const isbn: string = req.body.book.isbn;
  const base64IMGFull: string = req.body.base64;

  const type: string = "." + base64IMGFull.substr(11, 3);
  const base64Short: string = base64IMGFull.substr(22);

  const randomstring: string = await require("crypto")
    .randomBytes(16)
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
    if (transactionErr) return res.sendStatus(500);

    let fk_genre: number;
    let fk_format: number;
    let fk_file: number;

    const getGenreSQL: string = "SELECT id_genre FROM genre WHERE name = ?";
    sql.query(
      getGenreSQL,
      [insertBook.genre],
      (getGenreError: mysql.MysqlError, genreResults: Array<any>) => {
        if (getGenreError) return res.sendStatus(500);
        if (genreResults.length === 0) return res.sendStatus(404);

        fk_genre = genreResults[0].id_genre;

        const getFormatSQL: string =
          "SELECT id_genre FROM format WHERE name = ?";
        sql.query(
          getFormatSQL,
          [insertBook.format],
          (getFromatError: mysql.MysqlError, formatResults: Array<any>) => {
            if (getFromatError) return res.sendStatus(500);

            if (genreResults.length === 0) return res.sendStatus(404);

            fk_format = formatResults[0].id_genre;

            const insertFileSQL: string =
              "INSERT INTO file (name, path) VALUES (?, ?)";
            sql.query(
              insertFileSQL,
              [insertBook.file_name, insertBook.path],
              (insertFileError: mysql.MysqlError, insertFileResults: any) => {
                if (insertFileError) {
                  sql.rollback();
                  return res.sendStatus(500);
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
                    insertBookResults: Array<any>
                  ) => {
                    if (insertBookError) {
                      sql.rollback();
                      return res.sendStatus(500);
                    }

                    try {
                      fs.writeFileSync(
                        "../public_html/static/media/" + filename,
                        buff
                      );
                    } catch (error) {
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
