const {clientModel,serviceProviderModel} = require('../Modules/hotModules');

const isClientExists = async (clientID)=>{
    try{
        const data = await clientModel.findById(clientID);
        if(!data){
            return false;
        }
        return true;
    }
    catch(err){
        throw new Error(err.message);
    }
}

const isProviderExists = async (providerID)=>{
    try{
        const data = await serviceProviderModel.findById(providerID);
        if(!data){
            return false;
        }
        return true;
    }
    catch(err){
        throw new Error(err.message);
    }
}

module.exports = {
    isClientExists,
    isProviderExists
}
