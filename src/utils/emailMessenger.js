const nodemailer = require('nodemailer');

// Create transport object
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587, // Standard port for Gmail SMTP with STARTTLS
    secure: false, // Use TLS (false for port 587, true for port 465)
    auth: {
      user: process.env.USER, 
      pass: process.env.APP_PASS, 
    }
    });

async function Messenger(details) {
  try {
    // Validate details object
    if (!details?.receiver || !details?.code) {
      throw new Error("Receiver and code are required fields.");
    }

    // Send mail with the transport object
    const info = await transporter.sendMail({
      from: `"SP&CL Team" <${process.env.USER}>`, // Sender
      to: details.receiver, // Recipient
      subject: "Password Reset Security Code 🔐", // Subject
      html:`<h1>Your One Time Passcode is ${details.code}</h1>`
    });

    return info; // Return info for further use if needed
  } 
  catch (err) {
    throw err; 
  }
}

module.exports = Messenger;
