const express = require('express');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');
const {authenticateUser} = require('../Modules/hotModules');
const {isProviderExists} = require('../utils/isUserExist');
const fixerRouter = express.Router();

fixerRouter.get("/app/service/resquests/",authenticateUser,async (req,res)=>{
    try{
        // this operation is only valid for serviceProvider
        if(req.user.type!=="serviceProvider"){
            throw new Error ("Action restricted to User.")
        }

        // query to retrive all pending state requests to this serviceProvider.

        //.lean() method converts the Mongoose documents into plain JavaScript objects, which eliminates the extra metadata.
        const data = await serviceRequestModel.find({to_Id:req.user?._id,status:"pending"}).lean();
        
        if(data.length<1){
            throw new Error("Not requests yet.")
        }
        // dont send, from and To id 
        const result = data.map(({ from_Id, to_Id, ...rest }) => rest);

        res.status(200).send(result);

    }
    catch(err){
        res.status(400).send("Bad Request: "+err.message);
    }
})

fixerRouter.patch("/app/service/process/:type/look/:docID",authenticateUser,async (req,res)=>{
    try{
        const opType = req.params.type   // rejected or accepted
        const Id = req.params.docID;

        // checking the id of a document.
        const regexTest = /^[a-zA-z0-9]{24}$/.test(Id);

        // checking operationType
        const isOpType = opType==="accepted" || opType==="rejected";

        if(!regexTest || !isOpType){
            throw new Error("Bad request! Inappropriate data.");

        }
        // checking if that doc's status property is pending
        const isAllowed = await serviceRequestModel.findById(Id);
        
        if(isAllowed.status!=="pending"){
            throw new Error("Operation not possible.")
        }

        // find and update the document to respective opType
        const data = await serviceRequestModel.findByIdAndUpdate(Id,{status:opType},{new:true}).lean();
        if(!data){
            throw new Error("Request Not Found."); 
        }

        const { from_Id, to_Id, ...rest } = data;

        res.send(rest);
    }
    catch(err){
        res.status(400).send(err.message);
    }
})


module.exports = fixerRouter;