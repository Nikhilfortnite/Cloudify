const {passwordModel} = require('../Modules/hotModules');
const validator = require('validator');
const bcrypt = require('bcrypt');

function dataSanitation(reqData){
    //checks userType data.
    const allowedType = ["client","serviceProvider"];
    if(!allowedType.includes(reqData.userType)){
        return false;
    }

    // checks email data
    const allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];
    const domain = reqData.emailAddress.split("@")[1];
    if (!reqData.emailAddress || !validator.isEmail(reqData.emailAddress) || !allowedDomains.includes(domain) )  {
       
        return  false;
    }

    // checks password data
    if (!reqData.password || !validator.isStrongPassword(reqData.password)) {
        return false
      }

    return true;
}


async function checkCredentials(req,res,next){  // lets assume userType email and password are the only essential ones to log in
    try{
        const reqData = {
            userType:req.body.type,
            emailAddress:req.body.emailAddress,
            password:req.body.password
        };

        // check if data meets our validation rules.
        const isDataValid = dataSanitation(reqData);

        if(!isDataValid){
            return res.status(401).send("Invalid credentials."); 
        }

        const pswdDoc =  await passwordModel.findOne({userType:req.body.type,emailAddress:req.body.emailAddress})
        if(!pswdDoc){
           return res.status(404).send("User not found.");
        }

        //attach _id from passwordModel to req object.
        req.userId = pswdDoc._id.toString();

        // check password matches
        const isPasswordValid = await bcrypt.compare(req.body.password,pswdDoc.password);
        if(!isPasswordValid){
            return res.status(401).send("Invalid credentials.");
        }
        next();
    }
    catch(err){
        res.status(404).send(err.message);
    }
}

module.exports = checkCredentials;