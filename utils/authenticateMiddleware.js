
// Here we will be Writing a Middleware functions which we can use to Authenticate
// here we will write a function which will check weather the access token provided from the Frontend is valid or not based on that subsequent routes will be rendered

import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    try{ 
    // console.log("Authenticate Route !");
    const accessToken = req.headers.authorization.split(" ")[1];
    // console.log(accessToken);

    // let us check weather Access Token is present or not
    if(!accessToken){
        return res.status(401).json({error: true, message: "Access Token is not provided"})
    }

    // incase access token has been provided we will verify the access token
    const verifyAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN, (error, decode) => {
        // console.log(error);   // output :- error or undefined
        // console.log(decode);  //  Output :-  { username: 'jim', iat: 1716102295, exp: 1716102355 }  or undefined

        /*
        List of Errors :-
        1. TokenExpiredError: jwt expired
        2. JsonWebTokenError: jwt malformed
           we get this error when we do not pass proper base64 encoded String
        */
        // now let us check for errors and render appropriate Datas
        if(error){
            return res.status(401).json({error: true, message: `Error in Token :-  ${error.message}`});
        }

        // if no error has been occured let us call the [next()] method which will allow the codes written inside specific Routes
        next();
    });

}
catch(error){
    return res.status(500).json({error: true, message: `Internal Error inside authenticateMiddleware route :-  ${error}`});
}
}



export default authenticate;;