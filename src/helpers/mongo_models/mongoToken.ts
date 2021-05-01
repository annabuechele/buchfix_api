import * as mongo from "mongoose";

const mongoToken: mongo.Schema = new mongo.Schema({
  token: {
    required: true,
    type: String,
  },
  user: {
    required: true,
    type: Object,
    username: {
      required: true,
      type: String,
    },
    ip: {
      required: true,
      type: String,
    },
  },
  created_at: {
    required: true,
    type: Date,
  },
});

export default mongo.model("token", mongoToken);
