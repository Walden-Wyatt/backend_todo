// Here we will write different routes.
import e from "express";
import { addTodo, deleteTodo, getTodo, loginRoute, newAccessToken, signupRoute, updateTodo, } from "./controller.js";
import authenticate from "../utils/authenticateMiddleware.js";

const routes = e.Router();

routes.post("/signup", signupRoute);

routes.post("/login", loginRoute);

routes.post("/newaccesstoken", newAccessToken);


// ------------------ todo routes start

routes.post("/gettodo", authenticate, getTodo);

routes.post("/addtodo", authenticate, addTodo);

routes.post("/updatetodo", authenticate, updateTodo);

routes.post("/deletetodo", authenticate, deleteTodo);


// ------------------ todo routes end


// Logout Route
// routes.post("/logout", authenticate, logout);


export default routes;