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

//middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.redirect("https://google.com");
});

app.listen(PORT, () => {
  console.log(`Auth-Server is running in http://localhost:${PORT}`);
});
