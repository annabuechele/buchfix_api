import * as express from "express";
import * as jwt from "jsonwebtoken";

const router = express.Router();

//types
import UserLoginType from "../../types/userLoginType";

//mongo models
import tokenSchema from "../../helpers/mongo_schemas/mongoToken";

//DB connection object
import sql from "../../helpers/sql_db";

const genAccessToken: (user: UserLoginType) => string = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "10m",
  });
};

router.post("/token", async (req: express.Request, res: express.Response) => {
  const refreshToken = req.body.refreshToken;

  if (refreshToken == null) return res.sendStatus(401);

  const dbToken = await tokenSchema.find({ token: refreshToken });
  if (!dbToken.length) return res.sendStatus(403);

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err: jwt.VerifyErrors, user: UserLoginType) => {
      if (err) return res.sendStatus(403);
      const accessToken = genAccessToken({
        username: user.username,
        password: user.password,
      });

      res.status(200).send({ accessToken: accessToken });
    }
  );
});

router.post("/logout", async (req: express.Request, res: express.Response) => {
  const refreshToken = req.body.refreshToken;

  if (refreshToken == null) return res.sendStatus(401);

  const dbToken = await tokenSchema.find({ token: refreshToken });

  if (!dbToken.length) return res.sendStatus(403);

  const tokenID = dbToken[0]._id;

  await tokenSchema.findByIdAndRemove({ _id: tokenID });

  res.sendStatus(200);
});

router.post("/login", (req: express.Request, res: express.Response) => {
  const user: UserLoginType = {
    username: req.body.username,
    password: req.body.password,
  };
  const accessToken = genAccessToken(user);

  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

  const mongoToken = new tokenSchema({
    token: refreshToken,
    user: {
      username: user.username,
      ip: req.ip.substring(7),
    },
    created_at: Date.now(),
  });
  mongoToken.save();
  res
    .status(200)
    .send({ accessToken: accessToken, refreshToken: refreshToken });
});

export default router;
