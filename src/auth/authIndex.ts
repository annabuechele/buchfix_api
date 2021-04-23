import * as express from "express";
import { Request, Response } from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as morgan from "morgan";

const app = express();

//env config
dotenv.config();

//setting port of app
const PORT = process.env.AUTH_PORT || 4001;

//connection to db's
require("../helpers/sql_db");
require("../helpers/mongo_db");

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//routes

app.get("/", (req: Request, res: Response) => {
  res.redirect("https://buchfix.at");
});

app.listen(PORT, () => {
  console.log(`Auth-Server is running in http://localhost:${PORT}`);
});
