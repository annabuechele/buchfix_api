import * as express from "express";

const router = express.Router();

//DB connection object
const sql = require("../../helpers/sql_db");

//get user by username parameter
router.get("/:username", (req: express.Request, res: express.Response) => {});

//post new u
router.post("/new", (req: express.Request, res: express.Response) => {});

export default router;
