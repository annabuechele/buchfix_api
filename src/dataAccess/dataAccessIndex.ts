import * as dotenv from "dotenv";
//env config
dotenv.config();
import * as express from "express";
import * as cors from "cors";
import * as morgan from "morgan";
import * as rateLimiting from "express-rate-limit";

//routes
import statisticRoute from "./routes/statistic";
import bookRoute from "./routes/book";
import userRoute from "./routes/user";
import adminRoute from "./routes/admin";
const app = express();

//setting port of app
const PORT = process.env.DA_PORT || 4000;

//middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(rateLimiting({ windowMs: 1000, max: 10 })); //10 Requests/s

//routes
app.use("/user", userRoute);
app.use("/statistics", statisticRoute);
app.use("/book", bookRoute);
app.use("/admin", adminRoute);

app.get("/", (req: express.Request, res: express.Response) => {
  res.redirect("https://buchfix.at");
});

app.listen(PORT, () => {
  console.log(`Data-Access-Server is running in http://localhost:${PORT}`);
});
