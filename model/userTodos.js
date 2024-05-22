//here we will be having todo datas

import { ObjectId } from "bson";
import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userTodo = new Schema({
    userId: {
        type: ObjectId,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    todo: {
        type: [String],
        required: true,
    }
});

const userTodo_Collection = mongoose.model("usertodo", userTodo);

export default userTodo_Collection;