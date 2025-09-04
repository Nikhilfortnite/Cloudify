const express = require('express');
const {authenticateUser} = require('../Modules/hotModules');
const sendOffRouter = express.Router();

sendOffRouter.get("/app/sendoff/logout",authenticateUser,(req,res)=>{
    try{
        res.clearCookie('token');
        res.status(200).send('Logged Out successfully.');
    }
    catch(err){
        res.status(400).send("UnAuthorized Token.");
    }
})

module.exports = sendOffRouter;