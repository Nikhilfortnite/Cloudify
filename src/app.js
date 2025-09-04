const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const welcomeRouter = require('./Routes/welcome');
const sendOffRouter = require('./Routes/sendOff');
const fixItRouter = require('./Routes/fixIt');
const fixerRouter = require('./Routes/fixer');
const polishRouter = require('./Routes/polishMe');
const historyRouter = require('./Routes/fetchHistory');
const passwordSmithRouter = require('./Routes/pswdSmith')
const ImageRouter = require('./Routes/PhotoPedia')
const ratingRouter = require('./Routes/rating')

const app = express();

// built in  and custom middlewares

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser(process.env.COOKIE_SIGNATURE));

app.use("/",welcomeRouter);
app.use("/",polishRouter);
app.use("/",sendOffRouter);
app.use("/",fixItRouter);
app.use("/",fixerRouter);
app.use("/",historyRouter);
app.use("/",passwordSmithRouter);
app.use("/",ImageRouter);
app.use("/",ratingRouter)

app.use((err, req, res, next) => {

    if (res.headersSent) {
        return next(err); // Default handler if headers are already sent
    }

    // Handle specific errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).send({ error: 'Invalid JSON format in request body.' });
    }

    // Generic response for unknown errors
    res.status(err.status || 500).send({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong!',
    });
});




//connecting to db Cluster and then start to listen on port
function init(){
    if(mongoose.connection.readyState===0){
        mongoose.connect(process.env.DB_CONNECTION_STRING)
        .then(()=>{
            app.listen(3000,()=>{console.log("Server Listening on port 3000.")})
        })
        .catch((err)=>{
            console.log(err.message);
        })
    }
    else{
        console.log("Already Connected.")
    }
}

init();
    

