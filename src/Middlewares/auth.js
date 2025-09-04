const jwt = require('jsonwebtoken');

async function authenticateUser(req,res,next) {
    try{
        const token = req.signedCookies.token;
        if(!token){
            return res.status(401).send("Unauthorized: Invalid or missing token.");
        }

        const payload = await new Promise(function(resolve,reject){
            jwt.verify(token,process.env.JWT_SECRET,function(err,decoded){
                if(err){
                    reject(err);  // if promise is rejected then catch block will handle it.
                }
                resolve(decoded);
            })
        })

        req.user = payload;
        next();
    }
    catch(err){  
        res.status(401).send(`Unauthorized: ${err.message}`);
    }
}



module.exports = authenticateUser;