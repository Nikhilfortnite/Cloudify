const express = require('express');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');
const {authenticateUser} = require('../Modules/hotModules');
const {isProviderExists} = require('../utils/isUserExist');
const historyRouter = express.Router();

historyRouter.get("/app/history",authenticateUser,async (req,res)=>{
    try{
        const client = {from_Id:req.user?._id};
        const serviceProvider = {to_Id:req.user?._id};
        const queryData = req.user?.type==="client" ? client : serviceProvider;
        const data = await serviceRequestModel.find(queryData).lean();
        if(data.length<1){
            throw new Error("No service(s) requested yet.");
        }
        const result = data.map(({ from_Id, to_Id, ...rest }) => rest);
        res.send(result);

    }
    catch(err){
        res.status(400).send("Bad Request: "+err.message);
    }
})

module.exports = historyRouter;