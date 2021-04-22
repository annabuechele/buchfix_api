import * as express from "express";
import { Request, Response } from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as morgan from "morgan";

const app = express();

//env config
dotenv.config();

//setting port of app
const PORT = process.env.DA_PORT || 4000;

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the DataAcces-API of Buchfix!");
});

app.listen(PORT, () => {
  console.log(`Data-Access-Server is running in http://localhost:${PORT}`);
});
