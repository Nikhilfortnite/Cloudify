const express = require('express');
const validator = require('validator');
const {jwt,serviceProviderModel,passwordModel,clientModel,authenticateUser} = require('../Modules/hotModules');
const generateRandomSixDigitNumber = require('../utils/codeGenerator');
const generateJWT = require('../utils/jwtTokenGenerator');
const Messenger = require('../utils/emailMessenger');
const passwordHasher = require('../utils/passwordHasher');
const passwordSmithRouter = express.Router();

let allowedType = ["client","serviceProvider"];
let allowedDomains = ["gmail.com", "yahoo.com", "outlook.com"];


passwordSmithRouter.post("/app/security/sendcode",async (req,res)=>{
      try{

        // check if the code has been already sent.
        const isCodeToken = req.signedCookies?.secretCode;

        if(isCodeToken){
          // verify jwt and compare the time elapsed
          const payload = jwt.verify(isCodeToken,process.env.JWT_SECRET);
      
          //check if the time difference is more than 2 mins.
          if((new Date(payload?.validTill)-new Date(Date.now()))/1000 > 120)  
            return res.status(400).send("Secret Code has already been sent!");
        }

        // checks email data
        const domain = req.body?.emailAddress.split("@")[1];
        if (!req.body?.emailAddress || !validator.isEmail(req.body?.emailAddress) || !allowedDomains.includes(domain) )  {
            return res.status(400).send("Invalid Email Address.");
        }

        // checks type
        const userType = req.body?.type;
        if(!allowedType.includes(userType)){
            return res.status(400).send("Invalid User Type.");
        }

        // checks User Exists.
        const model = req.body.type ==="client" ? clientModel : serviceProviderModel;
        const isUserExists = await model.findOne({emailAddress: req.body?.emailAddress});
        if(!isUserExists){
            return res.status(400).send("User does not exists.");
        } 

        // generate code 
        const code = generateRandomSixDigitNumber();
        const codeToken = await generateJWT({secretCode:code,type:userType,_id:isUserExists._id.toString(),validTill:new Date(Date.now()+240*1000)});

        // send Mail
        const details = {code:code,receiver:isUserExists.emailAddress};
        const messageInfo = await Messenger(details);

        // set Cookie
        res.cookie('secretCode',codeToken,{httpOnly:true,signed:true,expires:new Date(Date.now() + 240*1000)}) 
        res.send({message:"Code sent to Mail. ",Mid: req.body?.emailAddress});
      }
      catch(err){
        res.status(400).send("Bad Request! "+err.message);
      }
})


passwordSmithRouter.post("/app/security/codeBouncer",async(req,res)=>{
  try{
    const userCode = req.body?.code;
    if(!userCode){
      return res.status(400).send("Bad Request: Missing Code");
    }
  
    // check if the cookie is present.
    const isCookiePresent = req.signedCookies?.secretCode;
    if(!isCookiePresent){
      return res.status(400).send("Bad Request: Token Not Found! Try Resend Code.");
    }
    
    // extract payload and verify them
    const payload = jwt.verify(isCookiePresent,process.env.JWT_SECRET);
    const {secretCode,type,_id} = payload;
  
    // check if any of em are null or unndefined.
    if(!secretCode || !type || !_id){
       return res.status(400).send("Bad Request: Invalid Token.");
    }
  
     // checks type
    if(!allowedType.includes(type)){
        return res.status(400).send("Bad Request: Invalid Token.");
    }
  
    // checks the code if it is Legit.
    if( userCode !== secretCode ){
      return res.status(400).send("Invalid Code.");
    }

    // clearing the secretCode cookie
    res.clearCookie('secretCode');
  
    const jwtToken = await generateJWT({_id:_id,type:type,resetAuthority:true});
  
    // same cookie as in login
    res.cookie('token',jwtToken,{httpOnly:true,signed:true,expires:new Date(Date.now() + 240*1000)}); 
    res.status(200).send({message:"allowUpdate"});
  }
  catch(err){
    res.status(500).send("Internal Server Error!");
  }
})


passwordSmithRouter.patch("/app/security/hashkey",authenticateUser,async(req,res)=>{
  try{
    // check if resetAuthority is present in cookie
  if(!req.user?.resetAuthority){
    return res.status(401).send("Action Not Allowed.");
  }
  
  // check if the password is strong
  if(!validator.isStrongPassword(req.body?.password)){
    return res.status(400).send("Password must include uppercase, lowercase, numbers, and special characters, and be at least 8 characters long.");
  }

  // check _id and userType
  if(!req.user?._id || !req.user?.type){
    return res.status(400).send("Missing Credentials!.");
  }

  // check if the user exist
  const model = req.user?.type ==="client" ? clientModel : serviceProviderModel;
  const isUserExists = await model.findById(req.user?._id);

  if(!isUserExists){
    res.status(404).send("User Not Found.");
  }

  // hash the password
  const hashedPassword = await passwordHasher(req.body?.password);

  // update password document
  const updatedDocument = await passwordModel.findByIdAndUpdate(req.user?._id,req.body?.password,{runValidators:true,new:true}); // note req.body.password is wrong

  // send response
  res.status(200).send(updatedDocument);
  }
  catch(err){
    res.status(500).send("Internal Server Error.")
  }
})


module.exports = passwordSmithRouter;



// issue is that the user have to write the code within 2 mins. Fix it.