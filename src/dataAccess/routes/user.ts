import * as express from "express";
import axios from "axios";
const router = express.Router();

//DB connection object
const sql = require("../../helpers/sql_db");

//get user by username parameter
router.get("/:username", (req: express.Request, res: express.Response) => {});

//post new user
router.post("/new", async (req: express.Request, res: express.Response) => {
  //google recaptcha
  const googleRes = await axios.post(
    `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${req.body.token}`
  );
  if (googleRes.data.success) {
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

export default router;
