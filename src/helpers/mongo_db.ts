import * as mongo from "mongoose";

const mongodb = mongo.connect(
  process.env.MONGO_STRING,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err: mongo.Error) => {
    if (err) return console.log(err);
    console.log("MongoDB connected");
  }
);

export default mongodb;
