// Here we will be writing the Callback functions which comes for every Routes.
import { loginValidate, signupValidate } from "../utils/validateData.js";
import userDetails from "../model/userdetails.js";
import bcrypt from "bcrypt";
import generateToken from "../utils/generateToken.js";
import userToken_Collection from "../model/userToken.js";
import jwt from "jsonwebtoken";
import userTodo_Collection from "../model/userTodo.js";
import { ObjectId } from "bson";



const signupRoute = async (req, res) => {
    try{
    const body = req.body;
    // console.log(body);

    // now let us check the data which user provided is valid or Not
    const validateSignup = signupValidate(body);
    console.log(validateSignup?.error);

    // let us check weather user has provided proper details without empty value
    if(body.username === "" || body.password === ""){
        return res.status(401).json({error: true, message: "You have failed to provide Username or Password plase do provide all this Details !"});
    }
    // check weather the length is greater than 8 
    if(body.password.length < 8){
        return res.status(401).json({error: true, message: "Password must have minimum 8 characters length !"});
    }

    // console.log(validateLogin);
    if(validateSignup.error){
        // console.log("hello")
        return res.status(401).json({error: true, message: validateSignup?.error?.details[0]?.message})
    }
    // check weather such data is present or not
    const checkUser = await userDetails.findOne({username: body.username});
    // console.log(checkData); // null  or matched object

    if(checkUser){
        return res.status(401).json({error: true, message: "This Document already exist, please try to Login !"});
    }

    // incase no such user has been found we have to hash the password by using salt and new the user details with the hashed password.
    const salt = await bcrypt.genSalt(Number(process.env.SALT));  // Output :-  $2b$15$SLsgdoEUrBAkGbW8.lIggu
    // console.log(salt);

    // now let us hash the password
    const hashPassword = await bcrypt.hash(body.password, salt);
    // console.log(hashPassword);  // Output :-  $2b$15$b8ybM0XjfP5lEHFRY0w56O/42BF0e3ZlkElbYcOETD586cjBzr2i6   or  null


    // now let us send the data inside MongoDB with the hashed password.
    const newUser = await new userDetails({...body, password: hashPassword}).save();
    // console.log(newUser);  // Output :- $2b$15$b8ybM0XjfP5lEHFRY0w56O/42BF0e3ZlkElbYcOETD586cjBzr2i6   or  null.

    if(!newUser){
        return res.status(401).json({error: true, message: "There was some error in saving the User details inside MongoDB"});
    }

    // incase no error inside "newUser" we will directly send [user registered successfully !]
    return res.status(201).json({error: false, message: "New User Created Successfully !"});

    }
catch(error){
    console.log(error);
    return res.status(500).json({error: true, message: "Internal Server Error !"});
}

};


// ------------------------------------------------------------------------------------------------------------------------------

// ------------- Login Route Start ------------------------------

const loginRoute = async (req, res) => {

    try{ 
    const body = req.body;
    // console.log(body);  // Output :- http://localhost:4000/signup   or  null

    const validateLogin = loginValidate(body);

    // let us check weather user has been provided proper data inside body object
    if(body.username === "" && body.password === ""){
        return res.status(401).json({error: true, message: "You have failed to provide Username or Password plase do provide all this Details !"})
    }

    //let us check the length of the password
    if(body.password.length < 8){
        return res.status(401).json({error: true, message: "Password must be Minimum 8 character length !"});
    }

    // now let us check weather body has valid details such as password
    if(validateLogin.error){
        return res.status(401).json({error: true, message: validateLogin?.error?.details[0].message})
    }

    // now let us check weather such user is present inside the data, if not present we will send please try to signup else we will login into the database
    const checkUser = await userDetails.findOne({username: body.username});
    // console.log(checkUser);  // Output :-  { _id: new ObjectId('664788316522249de7e07d2d'), username: 'jim', password: '$2b$15$VsOi6OPdleLd2WDiQw0MCO.wI7NZG077ld6Qh4RMDwU4CrYI0CiR.', __v: 0 }    or null
    if(!checkUser){
        return res.status(401).json({error: true, message: "You are not a Registered User please try to Signup"})
    }

    // incase user is present we have to validate the password, weather it is right or wrong
    const validatePassword = await bcrypt.compare(body.password, checkUser.password);
    // console.log(validatePassword); // false   or  true
    if(!validatePassword){
        return res.status(401).json({error: true, message: "You have entered a Wrong password please try to enter a Correct Password !"});
    }

    // incase password is correct we will get Access and Refresh Token and send it as a Response.
    const {accessToken, refreshToken} = await generateToken(checkUser);
    // console.log(accessToken);   // Output :-  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNTk2OTAxMCwiZXhwIjoxNzE1OTY5MDcwfQ.eJSMalWb4Q79m4uocRimuCbCKPalXuSoNz5Uhaecp_c   or  null
    // console.log(refreshToken);  // Output :-  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNTk2OTAxMCwiZXhwIjoxNzE1OTY5MDcwfQ.eJSMalWb4Q79m4uocRimuCbCKPalXuSoNz5Uhaecp_c   or  null

    console.log({accessToken, refreshToken})
    // now finally we will send success response which will include access and refresh token also
    return res.status(201).json({error: false, message: "Login Successful !", accessToken: accessToken, refreshToken: refreshToken});
}
catch(error){
    return res.status(500).json({error: true, message: `Internal Server Error !, ${error}`});
}

}


// ---------------------------------------------------------------------------------------------------------------

// ------------------------- Refresh Token Route --------------------------------------------------


const newAccessToken =  async(req, res) => {
    try{ 
    const body = req.body;
    const refreshTokenBody = body.refreshToken;
    // console.log(refreshTokenBody);
    // Now let us check weather we got refresh token from the Frontend or not
    // incase not provided we will send the error response
    if(!refreshTokenBody){
        return res.status(201).json({error: true, message: "Refresh token has not been provided !"});
    }

    // incase refresh token has been provided below lines of code will get executed
    // now let us check weather this refresh token is matched with any of the token present inside the database
    const checkToken = await userToken_Collection.findOne({refreshToken: refreshTokenBody});
    // console.log(checkToken);  //  Output :--    { _id: new ObjectId('664993efdbbe26e24181de66'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNjA5ODAzMCwiZXhwIjoxNzI5MDU4MDMwfQ.18hD0hnK77I9xfZ4GVPuuaLX5XzcTgsNm4D-xx7qBqk', __v: 0 }

    if(!checkToken){
        return res.status(401).json({error: true, message: "No document found with this refresh Token"})
    }

    // incase refresh token is found we have to verify weather it is right or wrong
    jwt.verify(refreshTokenBody, process.env.REFRESH_TOKEN, (error, decode) => {
        if(error){
            console.log(error);
            return res.status(401).json({error: true, message: "Refresh token does not matched with the Secret key"});
        }

        // incase there is no error, we will decode the payload
        // console.log(decode); // Output :-  { username: 'jim', iat: 1716098030, exp: 1729058030 }
        const newAccessToken = jwt.sign({username: decode.username}, process.env.ACCESS_TOKEN, {expiresIn: "3d"});
        // console.log(newAccessToken);  // Output :-  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNjA5OTI0MywiZXhwIjoxNzE2MDk5MzAzfQ.libgEdBPqEQibIJtJgRQQ5Jzpo8bc3kOPIrCp27_V4Y

        // now let us send the new access token as a response
        return res.status(201).json({error: false, message: "New access token generated", newAccessToken});
        // Output for above return :-    [  { "error": false, "message": "New access token generated", "newAccessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNjA5OTQyOCwiZXhwIjoxNzE2MDk5NDg4fQ.ilRxiPqTuTq3KdM3iyRdE50pmODIERhUD48HD20ZpFE" }   ].

    });
}
catch(error){
    return res.status(500).json({error: true, message: "Internal Server Error !"});
}
}


// ----------------------------------------------------------------------------------------------------

//   --------------------------------  Todo Route  --------------------------------
// apart from [Login, signup and refreshToken] routes for the Other routes we will be sending the datas through Headers



// const todoRoutePost = async (req, res)=>{

//     try{ 
//     const todobody = req.body;
//     // console.log(todobody.username);  // { username: 'jim', tododata: 'eating' }

//     // check weather data has been provided in the body
//     if(!todobody.username || !todobody.tododata){
//         console.log("username is undefined")
//         return res.status(401).json({error: true, message: "Plase provide value for username and tododata fields"})
//     }

//     // now let us check weather such userid is present inside the [userTodo] collection
//     const checkUsername = await userTodo_Collection.findOne({username: todobody.username});
//     // console.log(checkUsername);  // null or { _id: new ObjectId('6649c71e462a0562b7ec435f'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating' ], __v: 0 }

//     //incase user with the matched document is not present we have to create new document
//     if(!checkUsername){
//         const getUserDetails = await userDetails.findOne({username: todobody.username});
//         // console.log(getUserDetails); // Output :-  { _id: new ObjectId('664788316522249de7e07d2d'), username: 'jim', password: '$2b$15$VsOi6OPdleLd2WDiQw0MCO.wI7NZG077ld6Qh4RMDwU4CrYI0CiR.', __v: 0 }    or  null

//         // check weather such user is present or not
//         if(!getUserDetails){
//             return res.status(401).json({error: true, message: "No Document matched with this User details"})
//         }

//         // incase user is present we will get the the [_id] value and create new object ---> finally we will be sending it the the collection
//         const createTodoDocument = {userId: getUserDetails._id, username: getUserDetails.username, todo:todobody.tododata};
//         // console.log(createTodoDocument);  //  Output :-  { userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating' ] }    or  null

//         const createNewTodo = await new userTodo_Collection(createTodoDocument).save();
//         // console.log(createNewTodo);

//         if(!createNewTodo){
//             return res.status(401).json({error: true, message: "Data could not be saved Successfully !"})
//         }

//         return res.status(201).json({error: false, message: "Data saved into UserTodo collection successfully !"})
//     };

//     //  incase user is already present inside the Database collection we will be appending the data inside the database.
//     const updateUserName =  await userTodo_Collection.findOneAndUpdate({username: todobody.username},{...checkUsername._doc, todo: todobody.tododata});
//     // console.log(updateUserName); // Output :-  { _id: new ObjectId('6649c71e462a0562b7ec435f'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'Eating', 'Sleeping', 'Studing' ], __v: 0 }

//     // check weather any error has happened in saving [updateUserName] incase of error we will send 401
//     if(!updateUserName){
//         return res.status(401).json({error: true, message: "There is an Error in updating todo"})
//     }

//     return res.status(201).json({error: false, message: updateUserName});
// }
// catch(error){
//     return res.status(500).json({error: true, message: "Internal server Error in todoRoute !"});
// }


// }

// ----------------------------

// [/addtodo] route

const addTodo = async (req, res) => {

    try{


        // const addTodo = await new userTodo_Collection({userId: new ObjectId('664b0e69c6df0a211cfe0298'), username: "mat", todo: "hanging"}).save();
        // console.log(addTodo);


        const todobody = req.body;
        console.log(todobody);

        if(!todobody.username || !todobody.tododata) {
            return res.status(401).json({error: true, message: "Plese provide Username and tododata field"})
        };

        // Now let us check weather such data is already present inside the userTodo_collection
        const checkUserName = await userTodo_Collection.findOne({username: todobody.username});
        console.log(checkUserName);  // Output :-  { _id: new ObjectId('6649c71e462a0562b7ec435f'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [], __v: 0 }  or null

        if(!checkUserName){
            const getUserDetails = await userDetails.findOne({username: todobody.username});
            // console.log(getUserDetails);   //  Output :-  { _id: new ObjectId('664786b366ca21d4239ebc64'), username: 'tim', password: '$2b$15$i31TJGbM0B72dgm/N.Sm8.WrgefymXpz4APbkyUE0mVxA/FFqqvnu', __v: 0 }    or   null.

            if(!getUserDetails){
                return res.status(401).json({error: true, message: "No document matched with the Userdetails"});
            }

            // incase user is present let us create new document which will be inserting it inside the mongodb
            const createTodoDocument = {userId: getUserDetails._id, username: getUserDetails.username, todo: todobody.tododata};
            // const createTodoDocument = {userId: getUserDetails._id, username: "peter" , todo: todobody.tododata};
            console.log(createTodoDocument);

            // const createNewTodo = await new userTodo_Collection(createTodoDocument).save();
            const createNewTodo = await new userTodo_Collection(createTodoDocument).save();
            console.log(createNewTodo);

            // check for error
            if(!createNewTodo){
                return res.status(401).json({error: true, message: "Data could not be saved successfully !"});
            }

            return res.status(201).json({error: false, messaeg: "Data saved into Usertodo collection Successfully !"});
        }

        // incase there is matched document below lines of code will get executed
        const updateUser = await userTodo_Collection.findOneAndUpdate(
            {username: todobody.username},
            {$push: {todo: todobody.tododata}},
            {new: true}
        );

        console.log(updateUser);  // Output :-   app.post('/addTodo', async (req, res) => { try { const todobody = req.body; // Check whether data has been provided in the body if (!todobody.username || !todobody.tododata) { return res.status(401).json({ error: true, message: "Please provide value for username and tododata fields" }); } // Check whether such a userid is present inside the [userTodo] collection const checkUsername = await userTodo_Collection.findOne({ username: todobody.username }); // In case user with the matched document is not present, we have to create a new document if (!checkUsername) { const getUserDetails = await userDetails.findOne({ username: todobody.username }); // Check whether such user is present or not if (!getUserDetails) { return res.status(401).json({ error: true, message: "No Document matched with this User details" }); } // In case user is present, we will get the [_id] value and create a new object const createTodoDocument = { userId: getUserDetails._id, username: getUserDetails.username, todo: [todobody.tododata] }; const createNewTodo = await new userTodo_Collection(createTodoDocument).save(); if (!createNewTodo) { return res.status(401).json({ error: true, message: "Data could not be saved Successfully!" }); } return res.status(201).json({ error: false, message: "Data saved into UserTodo collection successfully!" }); } // In case user is already present inside the Database collection, we will be appending the data inside the database. const updatedUser = await userTodo_Collection.findOneAndUpdate( { username: todobody.username }, { $push: { todo: todobody.tododata } }, // Append the new todo item to the existing array { new: true } // Return the updated document ); // Check whether any error has happened in updating the document if (!updatedUser) { return res.status(401).json({ error: true, message: "There is an Error in updating todo" }); } return res.status(201).json({ error: false, message: "Todo updated successfully!", updatedUser }); } catch (error) { return res.status(500).json({ error: true, message: "Internal server Error in addTodoRoute!" }); } });    or   null

        // let us check weather any error has been occured inside the [updateUser ] variable
        if(!updateUser){
            return res.status(401).json({error: true, message: "There was an error in adding Todo items"})
        }

        // incase no error we will below lines of code will get executed
        return res.status(201).json({error: false, message: "Todo Item added successfully !", tododatas: updateUser})


    }
    catch(error){
        return res.status(500).json({error: true, message: `Internal Server Error inside /addroute :- ${error}`})
    }

}



// [/gettodo] route
const getTodo = async (req, res) =>{
// This function will get the Items from the todo field
    try{
        const todobody = req.body;
        console.log(todobody);  // { username: 'jim', tododata: 'Joking' }  or null
        if(!todobody.username){
            return res.status(401).json({error: true, message: "You have to provide username"});
        }

        // incase username has been provided we have to get those document from the userTodo_COllection
        const getTodoDatas = await userTodo_Collection.findOne({username: todobody.username });
        // console.log(getTodoDatas);  // Output :--  { _id: new ObjectId('664ac0cf2a05ba00287232ab'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating', 'playing Football' ], __v: 0 }   or  null

        if(!getTodoDatas){
            return res.status(401).json({error: true, message: "Document with this username is not found !"});
            // return res.status(401).json({error: true, message: "Document with this username is not found !"});
        }

        // incase we got the data we will be sending the data to the frontend
        return res.status(201).json({error: false, message: "Matched document is Present !", tododatas: getTodoDatas})


    }
    catch(error){
        return res.status(500).json({error: true, message: "Internal Server Error inside /addroute"})
    }
}


// [ /updatetodo] route
const updateTodo = async (req, res) => {

    try{
        const todobody = req.body;
        console.log(todobody);  // Output :-  { username: 'jim', tododata: 'eating', todoid: '2' }   or  null
        // from the frontend we will be getting an object with 2 fields username and tododata

        // check weather the datas have correct values
        if(!todobody.username || !todobody.tododata /* || !todobody.todoid */ ){
            return res.status(401).json({error: true, message: "Plase provide username, tododata and todoid it should not be empty"});
        }

        // incase username and todoitem has been provided we will just update using "findOneAndUpdate" method
        // check weather that specific user is present inside the todo collection
        const checkTodoUser = await userTodo_Collection.findOne({username: todobody.username});
        // console.log(checkTodoUser);  //  Output :-  { _id: new ObjectId('6649c71e462a0562b7ec435f'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating', 'eating', 'baking', 'eating', 'baking', 'coking', 'eating', 'baking', 'sleeping', 'cooking', 'Baking', 'Baking', 'Baking', 'Baking', 'swimming' ], __v: 0 }  or  null

        if(!checkTodoUser){
            return res.status(401).json({error: true, message: "No UserTodo matched with the provided details"})
        }

        checkTodoUser.todo[todobody.todoid] = todobody.tododata;
        console.log(checkTodoUser.todo);   //  Output :-   [ 'eating', 'eating', 'hey i am playing', 'eating', 'baking', 'coking', 'eating', 'baking', 'sleeping', 'cooking', 'Baking', 'Baking', 'Baking', 'Baking', 'swimming' ]    or    null

        // now let us send this new data to the mongodb backend
        const updatedTodd = await userTodo_Collection.updateOne({username: todobody.username}, {$set: { ...checkTodoUser}});
        // console.log(updatedTodd);   // { object with updated value }   or   null

        const afterUpdated = await userTodo_Collection.findOne({username: todobody.username});
        // console.log(afterUpdated);

        if(!afterUpdated){
        // const updatedTodd = await userTodo_Collection.findOneAndUpdate({username: todobody.username}, {$set: { ...checkTodoUser, todoid: checkTodoUser.todo }});
        // const updatedTodd = await userTodo_Collection.updateOne({username: todobody.username}, {$set: { ...checkTodoUser, todoid: checkTodoUser.todo }});
        return res.status(401).json({error: true, message: "New Data has not been updated" });
        }
        
        return res.status(201).json({error: false, message: "New Todo Array has been Updated Successfully !", tododatas: afterUpdated});

    }
    catch(error){
        return res.status(500).json({error: true, message: "Internal Server Error inside /addroute"})
    }
}

// [ /deletetodo] route
const deleteTodo = async (req, res) => {

    try{
        // here we will be deleting the items which is inside the todo data
        const todobody = req.body;
        console.log(todobody);  // Output :-  { username: 'jim', tododata: 'dddd', todoid: 15 }   or  null   
        // // check weather the datas have correct values
        if(!todobody.username /* || !todobody.todoid */ ){
            return res.status(401).json({error: true, message: "Plase provide username and todoid it should not be empty"});
        }

        // // incase username and todoitem has been provided we will just update using "findOneAndUpdate" method
        // // check weather that specific user is present inside the todo collection
        const checkTodoUser = await userTodo_Collection.findOne({username: todobody.username});
        // console.log(checkTodoUser);  //  Output :-  { _id: new ObjectId('6649c71e462a0562b7ec435f'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating', 'eating', 'baking', 'eating', 'baking', 'coking', 'eating', 'baking', 'sleeping', 'cooking', 'Baking', 'Baking', 'Baking', 'Baking', 'swimming' ], __v: 0 }  or  null

        if(!checkTodoUser){
            return res.status(401).json({error: true, message: "No UserTodo matched with the provided details"})
        }

        // // incase user is present 
        const deleteTodoItem = checkTodoUser.todo.splice(todobody.todoid, 1);
        // console.log(deleteTodoItem);  // true or false
        // console.log(checkTodoUser.todo);   // { object after deleting the value from todo array }.

        if(!deleteTodoItem){
            return res.status(401).json({error: true, message: "Todo array data has not been deleted successfully !"});
        }

        const deletedTodo = await userTodo_Collection.updateOne({username: todobody.username}, {$set: {...checkTodoUser }});
        console.log(deletedTodo);  // { _id: new ObjectId('664ac0cf2a05ba00287232ab'), userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', todo: [ 'eating', 'Watching movies', 'Joking' ], __v: 0 }  or  null


        const afterDeleted = await userTodo_Collection.findOne({username: todobody.username});
        console.log(afterDeleted);
    

        if(!afterDeleted){
            return res.status(401).json({error: true, message: "Todo item has not been deleted."});
        }

        return res.status(201).json({error: false, message: "Todo item has been deleted successfully !", tododatas: afterDeleted});

    }
    catch(error){
        return res.status(500).json({error: true, message: "Internal Server Error inside /addroute"})
    };



}


    // Logout Route
// const logout = () => {

//     localStorage.clear("accessToken");
//     localStorage.clear("refreshToken");

// }


export {signupRoute, loginRoute, newAccessToken, getTodo, addTodo, updateTodo, deleteTodo};