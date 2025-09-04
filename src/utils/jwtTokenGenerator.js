const {jwt} = require('../Modules/hotModules');

async function generateJWT(payload){
    try{
        const secret = process.env.JWT_SECRET;
        const options = {expiresIn:240}      // for four minutes to check.
        const tokenPromise = await new Promise(function(resolve,reject){  // await bcz jwt.sign is an asynchronous task provided callback also to avoid fast resolve without token .
            jwt.sign(payload,secret,options,function(err,token){
                if(err){
                    reject(err);
                }
                resolve(token);
            })
        });

        return tokenPromise;

    }
    catch(err){
        throw new Error(`Token Generation failed: ${err.message}`);
    }
}


module.exports = generateJWT;