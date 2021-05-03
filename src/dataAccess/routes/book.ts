import * as express from "express";
import * as fs from "fs";
import validateUser from "../../helpers/validateUser";
import BookType from "../../types/bookType";
const router = express.Router();
import * as mysql from "mysql";

//DB connection object
import sql from "../../helpers/sql_db";
import { EROFS } from "node:constants";

router.post("/new", (req: express.Request, res: express.Response) => {
  try {
    const isbn: string = req.body.book.isbn;
    const base64IMGFull: string = req.body.base64;

    const type: string = "." + base64IMGFull.substr(11, 3);

    const base64Short: string = base64IMGFull.substr(22);

    let buff = Buffer.from(base64Short, "base64");

    fs.writeFileSync("../static/media/" + isbn + type, buff);

    const insertNook: BookType = {
      format: req.body.book.format,
      genre: req.body.book.genre,
      isbn: isbn,
      path: "/static/media/",
      file_name: +isbn + type,
      sites: req.body.book.sites,
      title: req.body.book.title,
    };
  } catch (error) {
    return res.sendStatus(500);
  }

  //   sql.beginTransaction((transactionErr: mysql.MysqlError) => {
  //     if (transactionErr) return res.sendStatus(500);

  //     const getGenreSQL: string = "SELCT id_genre FROM genre WHERE name = ?";
  //     sql.query(
  //       getGenreSQL,
  //       [],
  //       (getGenreError: mysql.MysqlError, genreResults: Array<any>) => {
  //         if (genreResults.length === 0) return res.sendStatus(404);
  //       }
  //     );
  //   });
});

export default router;
