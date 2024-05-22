// here we will write the code which will validate the User Details
import joi from "joi";
import password_complexity from 'joi-password-complexity';


const loginValidate = (body) => {

    const validateRules = joi.object({
        username: joi.string().required().label("username"),
        password: password_complexity().required().label("password"),
    });

    const verifyData = validateRules.validate(body);
    // console.log(verifyData.error.details[1].message);
    return verifyData;
}



const signupValidate = (body) => {

    const validateRules = joi.object({
        username: joi.string().required().label("username"),
        password: password_complexity().required().label("password"),
    });

    const verifyData = validateRules.validate(body);
    // console.log(verifyData.error?.details[1].message);
    return verifyData;
}

// Test "loginValidate" function
// loginValidate({username:"peter", password: "abc123A!"});
// signupValidate({username:"peter", password: "abc123A"});

export {loginValidate, signupValidate};