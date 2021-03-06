import * as express from "express";
import * as jwt from "jsonwebtoken";

const router = express.Router();

//types
import UserLoginType from "../../types/userLoginType";

//mongo models
import tokenSchema from "../../helpers/mongo_schemas/mongoToken";

const genAccessToken: (user: UserLoginType) => string = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

router.post("/token", async (req: express.Request, res: express.Response) => {
  console.log("token req");
  const refreshToken = req.body.refreshToken;

  if (refreshToken == null) return res.status(401).send("No Token provided");

  const dbToken = await tokenSchema.find({ token: refreshToken });
  if (!dbToken.length) return res.status(403).send("Refresh-Token not found");

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err: jwt.VerifyErrors, user: UserLoginType) => {
      if (err) return res.status(403).send("Error in verifying Token");
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

  if (refreshToken == null) return res.status(401).send("No token provided");

  const dbToken = await tokenSchema.find({ token: refreshToken });

  if (!dbToken.length) return res.status(403).send("Refresh-Token not found");

  const tokenID = dbToken[0]._id;

  await tokenSchema.findByIdAndRemove({ _id: tokenID });

  res.status(200).send("Logout successful!");
});

router.post("/login", (req: express.Request, res: express.Response) => {
  const user: UserLoginType = {
    username: req.body.username,
    password: req.body.password,
  };
  const accessToken = genAccessToken(user);

  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
  try {
    const mongoToken = new tokenSchema({
      token: refreshToken,
      user: {
        username: user.username,
        ip: req.ip,
      },
      created_at: Date.now(),
    });
    mongoToken.save();
  } catch (mongoError) {
    res.status(500).send("Error in processing Data");
  }

  res
    .status(200)
    .send({ accessToken: accessToken, refreshToken: refreshToken });
});

export default router;
