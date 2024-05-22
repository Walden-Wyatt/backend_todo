
// here we will have a function which will return an object which will have accessToken and refreshToken

import jwt from "jsonwebtoken";
import userToken_Collection from "../model/userToken.js";


const generateToken = async (userDetailsBody) => {
    // console.log(userDetailsBody);  // Output :-  { username: 'jim', password: 'abc123!A' }   or   null
    
    // here let us create a Payload which we can use to create AccessToken and RefreshToken.
    const payload = {username: userDetailsBody.username};

    // now let us load access and refresh token from [.env] file
    const accessToken_Key = process.env.ACCESS_TOKEN
    const refreshToken_Key = process.env.REFRESH_TOKEN
    // console.log(accessToken);  // output :- ACCESS_TOKEN or null
    // console.log(refreshToken); // output :- REFRESH_TOKEN or null

    // now let us create access and refresh token
    const accessToken = jwt.sign(payload, accessToken_Key, {expiresIn: "10d"});
    const refreshToken = jwt.sign(payload, refreshToken_Key, {expiresIn: "150d"});

    // now let us check weather the above refresh token matches the token which is present inside the database or not
    const findUser = await userToken_Collection.findOne({userId: userDetailsBody._id});
    // console.log(findUser);  // output :-  null  or object which has been matched.

    // incase such user if present we will be deleting the existing userToken and create a new userToken, else we will directly create a New User token.
    if(findUser){
        const deleteUser = await userToken_Collection.deleteOne({userId: userDetailsBody._id});
        console.log(deleteUser);  // output : - { acknowledged: true, deletedCount: 1 }   or   null.
    }

    // here let us create New Token
    const newUserToken = {userId: userDetailsBody._id, username: userDetailsBody.username, refreshToken: refreshToken};
    const newToken = await new userToken_Collection(newUserToken).save();
    if(!newToken){
        return {error: true, message: "Error while saving new Refresh Token inside userToken database !"}
    }
    // console.log(newToken);  // output :-- { userId: new ObjectId('664788316522249de7e07d2d'), username: 'jim', refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImppbSIsImlhdCI6MTcxNTk2ODU1NiwiZXhwIjoxNzI4OTI4NTU2fQ.rUhHUlPsVpHVJmKxwN-hbnMakQkr7GP3l4IpcYNQTp8', _id: new ObjectId('66479a2d8e99b5826ef9404c'), __v: 0 }   or null.

    console.log(accessToken);
    // now finally we will be sending [accessToken and refreshToken] as return statement for this function
    return Promise.resolve({accessToken, refreshToken});

};




// test generateToken
// generateToken({username: "abc", password: "abc123!A"});

export default generateToken;


