const validator = require('validator');

const validateData = function (req, res, next) {
  const regex = /^[a-zA-Z ]{2,20}$/; // Validate names with 2-20 characters, only alphabets and spaces
  const {type, gender, firstName, middleName, lastName, emailAddress, password, phoneNumber } = req.body;
  // validate type
  const allowedType = ["client","serviceProvider"];
  if(!allowedType.includes(type)){
    return res.status(400).send("Invalid user type.");
  }
  //validate gender if present

  const genderType = ["female","male","transgender"];
  if(gender && !genderType.includes(gender)){
    return res.status(400).send("Invalid Gender.");
  }
  // Validate first name
  if (!firstName || !regex.test(firstName)) {
    return res.status(400).send("First Name should have 2-20 characters [a-zA-Z].");
  }

  // Validate middle name (if provided)
  if (middleName && !regex.test(middleName)) {
    return res.status(400).send("Middle Name should have 2-20 characters [a-zA-Z].");
  }

  // Validate last name
  if (!lastName || !regex.test(lastName)) {
    return res.status(400).send("Last Name should have 2-20 characters [a-zA-Z].");
  }

  // Validate email address
  if (!emailAddress || !validator.isEmail(emailAddress)) {
    return res.status(400).send("Email Address is invalid.");
  }

  // Validate password
  if (!password || !validator.isStrongPassword(password)) {
    return res.status(400).send(
      "Password must include uppercase, lowercase, numbers, and special characters, and be at least 8 characters long."
    );
  }

  // Validate phone number
  if (!phoneNumber || !validator.isMobilePhone(phoneNumber, 'en-IN', { strictMode: true })) {
    return res.status(400).send("Phone Number is invalid.");
  }

  next(); // All validations passed, proceed to the next middleware
};


module.exports = validateData;