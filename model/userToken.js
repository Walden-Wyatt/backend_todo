// here we will be creating User Token collection
import { ObjectId } from "bson";
import mongoose, { Schema } from "mongoose"
const schema = mongoose.Schema;

const userTokenSchema = new Schema({
    userId: {
        type: ObjectId,
        required: true,
        unique: true,
    },
    username:{
        type: String,
        required: true,
        unique: true
    },
    refreshToken: {
        type: String,
        required: true,
    }
});

// now let us create a Model
const userToken_Collection = mongoose.model("userToken", userTokenSchema);

export default userToken_Collection;