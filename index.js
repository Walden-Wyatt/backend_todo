 // Let us create Server file
import e from "express";
import dotenv from "dotenv";
import dbConnect from "./model/dbconnect.js";
import routes from "./controller/routes.js";
import cors from "cors";

dotenv.config();

const app = e();

app.use(cors());
app.use(e.json());
dbConnect();
app.use(routes);




app.listen(process.env.PORT, () => {
    console.log("Server Running on PORT 4000");
});










