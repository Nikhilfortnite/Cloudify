const express = require('express');
const {clientModel,serviceProviderModel,passwordModel,jwt} = require('../Modules/hotModules');
const validateData = require('../Middlewares/APIvalidation');
const checkCredentials = require('../Middlewares/validateUserCredentials');
const passwordHasher = require('../utils/passwordHasher');
const generateJWT = require('../utils/jwtTokenGenerator');
const welcomeRouter = express.Router();

async function passwordInsertion(userID,type,emailAddress,hashedPassword){
    try{const passWordData = {
        _id:userID,
        userType:type,
        emailAddress:emailAddress,
        password:hashedPassword
    }
    const passwordDocument = new passwordModel(passWordData);
    await passwordDocument.save();
    }catch(err){
        throw new Error(err.message);
    }
}
// NOTE: captcha check should be considered
 
welcomeRouter.post("/app/welcome/signUp",validateData,async(req,res)=>{  // lets say during signUp user sends type f,m,l name and email,phoneNumber and password
    try{
        // check the user type.
        if(req.body.type==="client"){
            // check if the gender is undefined.
            if(!req.body.gender){
                throw new Error("Gender cannot be undefined.");
            }
            // check if the user is already registered.
            const isAlreadyRegistered = await clientModel.findOne({emailAddress:req.body.emailAddress});

            if(isAlreadyRegistered){
                throw new Error("User Already exists! Try Logging in.")
            }

            // store the data in clientModel
            const insertClientOperation = new clientModel(req.body);
            const savedClientUser = await insertClientOperation.save();
            // geting _id thats created during user Insertion.
            const clienUserID = savedClientUser._id.toString();
            // hashing password
            const clientHashedPassword = await passwordHasher(req.body.password);   // since it is a asynchronous task.
            // add the hashed password to collection.
            await passwordInsertion(clienUserID,req.body.type,req.body.emailAddress,clientHashedPassword);
            // creating jwt token 
            const clientJwtToken = await generateJWT({_id:clienUserID,type:"client"});
            // binding signed cookie to response.
            res.cookie('token',clientJwtToken,{httpOnly:true,signed:true,expires:new Date(Date.now() + 240*1000)});  // 4 minutes in milliseconds
        }
        else if(req.body.type==="serviceProvider"){

            const isAlreadyRegistered = await serviceProviderModel.findOne({emailAddress:req.body.emailAddress});

            if(isAlreadyRegistered){
                throw new Error("User Already exists! Try Logging in.")
            }

            const insertServiceProviderOperation = new serviceProviderModel(req.body);
            const savedServiceProviderUser = await insertServiceProviderOperation.save();

            const serviceProviderID = savedServiceProviderUser._id.toString();
            const hashedPassword = await passwordHasher(req.body.password);

            await passwordInsertion(serviceProviderID,req.body.type,req.body.emailAddress,hashedPassword);
            const jwtToken = await generateJWT({_id:serviceProviderID,type:"serviceProvider"});

            res.cookie('token',jwtToken,{httpOnly:true,expires:new Date(Date.now() + 240*1000)});
        }
        res.status(200).send(req.body);
    }
    catch(err){
        res.status(400).send(err.message);
    }
});


welcomeRouter.post("/app/welcome/login",checkCredentials,async (req,res)=>{
    try{
     
      // check whether he is already logged in. 
        const token  = req.signedCookies.token;
        if(token){
            const payload = jwt.verify(token,process.env.JWT_SECRET);
            if(payload.type===req.body.type)
            return res.status(200).send("User already Logged in.");
        }
      // fetching userDetails to send back in request.
      const model = req.body.type ==="client" ? clientModel : serviceProviderModel;
      const userData = await model.findById(req.userId);
      // creating jwt token 
      const jwtToken = await generateJWT({_id:req.userId,type:req.body.type});
      // binding signed cookie to response.
      res.cookie('token',jwtToken,{httpOnly:true,signed:true,expires:new Date(Date.now() + 240*1000)});  // 4 minutes in milliseconds
      const {_id,createdAt,updatedAt,__v, ...cleanedData} = userData.toObject();
      res.status(200).send(cleanedData);
    }
    catch(err){
        res.status(400).send("Log In Failed: "+err.message);
    }
});


module.exports = welcomeRouter;