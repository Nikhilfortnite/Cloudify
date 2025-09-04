const validator = require('validator');

const polishDataValidator = (updateType,userType,reqData)=>{

    // first check the userType is any one of two
    if(!["client", "serviceProvider"].includes(value)){
      throw new Error("Invalid User.");
    }
    
    // if user is a client then he cannot update shopName and serviceProvided and if a ServiceProvider he cannot update gender.
    const usersMap = {
      "client":["all","firstName","middleName","lastName","gender","presentAddress","phoneNumber"],
      "serviceProvider":["all","firstName","middleName","lastName","presentAddress","phoneNumber","shopName","serviceProvided"]
    }

    const allowedType = usersMap[userType];

    // check if the update request is for all or specific one. If for all, check reqData length matches allowedType.lenght-1
    // REMINDER: Not Test this yet. 
    if(updateType==="all" && allowedType?.length != Object.keys(reqData).length+1){
      throw new Error("Some data is missing!");
    }

    const regex = /^[a-zA-Z ]{2,20}$/;
    // check the update type is within the allowed type.
    const isupdateAllowed = allowedType.includes(updateType) && Object.keys(reqData).every(type=>allowedType.includes(type));
    if(!isupdateAllowed){
        throw new Error("Invalid data provided.");
    }

    if(updateType==="all" || updateType==="name"){                                    // for only name update API.
        // Validate firs name (if provided)
        if (reqData.firstName && !regex.test(reqData.firstName)) {
            throw new Error("First Name should have 2-20 characters [a-zA-Z].");
          }
        
          // Validate middle name (if provided)
          if (reqData.middleName && !regex.test(reqData.middleName)) {
            throw new Error("Middle Name should have 2-20 characters [a-zA-Z].");
          }
        
          // Validate last name (if provided)
          if (reqData.lastName && !regex.test(reqData.lastName)) {
            throw new Error("Last Name should have 2-20 characters [a-zA-Z].");
          }
    }
    
    if(updateType==="all" || updateType==="gender"){                                  // for only name update API.
        const genderType = ["female","male","transgender"];
        if(reqData.gender && !genderType.includes(reqData.gender)){
            throw new Error("Gender data Invalid.");
        }
    }

    if(updateType==="all" || updateType==="presentAddress"){                           // for only address update API. 
        // for address based on the field that u give in ui like landmark houseNo check those individuals also in future.
        const addressRegex = /^[a-zA-Z0-9\s.,\-]{10,250}\.?$/ ;
        if(reqData.presentAddress && !addressRegex.test(reqData.presentAddress.trim())){
            throw new Error("Invalid Address provided.");
        }
    }

    if(updateType==="all" || updateType==="phoneNumber"){                               // for only phoneNumber update API.
        if (reqData.phoneNumber && !validator.isMobilePhone(reqData.phoneNumber, 'en-IN', { strictMode: true })) {
            throw new Error("Invalid Phone Number.");
          }
    }

    if(updateType==="all" || updateType==="shopName"){                                     // for only shopName update API.
        const shopNameRegex = /^[a-zA-Z0-9\s&'.,-]{8,30}$/;
        if(reqData.shopName && !shopNameRegex.test(reqData.shopName)){
            throw new Error("Shop Name should only contain [a-zA-Z] "+ ", " +". "+ "- "+ "characters");
        }
    }

    if(updateType==="all" || updateType==="serviceProvided"){                             // for only serviceProvided update API.
        const types = new Set([
            "laptop", "mobile", "waterfilter", "inverter", "solar", "refrigerator", 
            "tv", "washing machine", "home cleaning", "laundry", "private chef"
          ]);
          
          // Check if all services are valid and ensure no duplicates
          const isValidAndUnique = reqData.serviceProvided?.every((service, index, array) => 
            types.has(service) && array.indexOf(service) === index
          );
          
          if (!isValidAndUnique) {
            throw new Error("Invalid data provided.");
          }          
           
        }
    


    return true;
}

module.exports = polishDataValidator;