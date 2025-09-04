const express = require('express');
const {authenticateUser,serviceProviderModel,clientModel} = require('../Modules/hotModules');
const polishDataValidator = require('../utils/polishAPICheck');
const polishRouter = express.Router();


// this handler is for specific intended update.
polishRouter.patch("/app/account/update/:type",authenticateUser,async(req,res)=>{  
    try{
        const updateType = req.params.type;
        // call this function to sanitize our data
        polishDataValidator(updateType,req.user?.type,req.body);  // if the data is inaccurate this function throws an Error.

        // add legit data to database
        const model = req.user?.type==="client" ? clientModel : serviceProviderModel;
        const addDocument = await model.findByIdAndUpdate(req.user?._id,req.body,{runValidators:true,new:true})
        res.status(200).send(addDocument);

    }
    catch(err){
        res.status(400).send(err.message);
    }
});

// this handler is for all updates for once.
polishRouter.patch("/app/account/updateAll",authenticateUser,async(req,res)=>{
    try{
        polishDataValidator("all",req.user?.type,req.body);

        // add legit data to database
        const model = req.user?.type==="client" ? clientModel : serviceProviderModel;
        const addDocument = await model.findByIdAndUpdate(req.user?._id,req.body,{runValidators:true,new:true})
        res.status(200).send(addDocument);
    }
    catch(err){
        res.status(400).send(err.message);
    }

})


module.exports = polishRouter;