// Here let us Create Connection to MongoDB 
import mongoose from "mongoose";

const dbConnect = () => {

    mongoose.connect(process.env.MONGODB_CONNECTION)
    .then((value) => {
        console.log("MongoDB Connected Successfully !");
    })
    .catch((error) => {
        console.log("MongoDB Failed to Connect Successfully", error);
    });
};


export default dbConnect;