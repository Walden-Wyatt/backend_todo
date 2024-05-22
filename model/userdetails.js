

import mongoose from "mongoose";

// create Schema
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
});


// now let us create model
const userDetails = mongoose.model("userDetails", userSchema);

export default userDetails;



