const express = require('express');
const { authenticateUser, clientModel, serviceProviderModel } = require('../Modules/hotModules');
const serviceRequestModel = require('../SchemaModels/ServiceRequests');
const ratingModel = require('../SchemaModels/Ratings');
const ratingRouter = express.Router();

ratingRouter.post('/app/service/rate', authenticateUser, async (req, res) => {
    try {
        const { rating, serviceRequestID, description } = req.body;

        if (!rating || !serviceRequestID) {
            return res.status(400).send({ result: "failed", message: "Bad Request! Missing data." });
        }

        const ratingValue = Number(rating);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).send({ result: "failed", message: "Rating value is not in the range." });
        }

        const [serviceInfo, clientInfo] = await Promise.all([
            serviceRequestModel.findById(serviceRequestID),
            clientModel.findById(req.user?._id)
        ]);

        if (!serviceInfo || !clientInfo) {
            return res.status(400).send({ result: "failed", message: "Bad Request! Invalid data." });
        }

        if(serviceInfo.rating){
            return res.status(400).send({ result: "failed", message: "Rating already given try updatig it." });
        }


        const toRating = serviceInfo.to_Id;

        const name = clientInfo.middleName
            ? `${clientInfo.firstName} ${clientInfo.middleName} ${clientInfo.lastName}`
            : `${clientInfo.firstName} ${clientInfo.lastName}`;

        const lastReviewData = await serviceProviderModel.findById(toRating);
        if (!lastReviewData) {
            return res.status(404).send({ result: "failed", message: "Could not find Service Provider." });
        }

        const newTotalNumberOfReviews = lastReviewData.totalNumberOfReviews + 1;
        const newtotalRatings = lastReviewData.totalRatings + ratingValue;
        const newAvrRating = newtotalRatings / newTotalNumberOfReviews;

        const [updateServiceRequest, updateServiceProviderRatings] = await Promise.all([
            serviceRequestModel.findByIdAndUpdate(
                serviceRequestID,
                { rating: ratingValue },
                { new: true }
            ),
            serviceProviderModel.findByIdAndUpdate(
                toRating,
                {
                    totalNumberOfReviews: newTotalNumberOfReviews,
                    totalRatings: newtotalRatings,
                    avrRating: newAvrRating
                },
                { new: true }
            )
        ]);
        
        if (!updateServiceRequest) {
            return res.status(400).send({ result: "failed", message: "Failed to update service request rating." });
        }

        if (!updateServiceProviderRatings) {
            return res.status(400).send({ result: "failed", message: "Average Rating calculation failed." });
        }

        const documentData = {
            _id: serviceRequestID,
            to_Id: toRating,
            clientName: name,
            rating: ratingValue,
            ...(description && { description })
        };

        const newDocument = new ratingModel(documentData);
        await newDocument.save();

        res.send({
            result: "success",
            message: "Thank you for giving your valuable time for us.",
            updatedRating: newAvrRating,
            rating:ratingValue
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ result: "failed", message: err.message });
    }
});

ratingRouter.patch('/app/service/review/update',authenticateUser, async (req,res)=>{
    try {
        const { newRating, serviceRequestID, description } = req.body;

        if (!newRating || !serviceRequestID) {
            return res.status(400).send({ result: "failed", message: "Bad Request! Missing data." });
        }

        const ratingValue = Number(newRating);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return res.status(400).send({ result: "failed", message: "Rating value is not in the range." });
        }

        if(description && !description.trim()){
            return res.status(400).send({ result: "failed", message: "Description cannot be empty or just spaces." });
        }

        const [serviceInfo, prevRating] = await Promise.all([
            serviceRequestModel.findById(serviceRequestID),
            ratingModel.findById(serviceRequestID),
        ]);

        if (!serviceInfo || !prevRating) {
            return res.status(400).send({ result: "failed", message: "Bad Request! Invalid data." });
        }

        if(!serviceInfo.rating){
            return res.status(400).send({ result: "failed", message: "Rate first to update." });
        }

        if(prevRating.rating === ratingValue && prevRating.description === description){
            return res.status(400).send({ result: "failed", message: "Review same as previous one." });
        }

        const toRating = serviceInfo.to_Id;
        const previousRating = serviceInfo.rating;
        
        const updateData = {
            rating:ratingValue,
            ...(description && {description})
        }

        const lastReviewData = await serviceProviderModel.findById(toRating);
        if (!lastReviewData) {
            return res.status(404).send({ result: "failed", message: "Could not find Service Provider." });
        }

        const TotalNumberOfReviews = lastReviewData.totalNumberOfReviews
        const newtotalRatings = lastReviewData.totalRatings - previousRating + ratingValue;
        const newAvrRating = newtotalRatings / TotalNumberOfReviews;
        
        const [serviceRequestDoc,ratingDoc,serviceProviderDoc] = await Promise.all([
            serviceRequestModel.findByIdAndUpdate(serviceRequestID,{rating:ratingValue}),
            ratingModel.findByIdAndUpdate(serviceRequestID,updateData),
            serviceProviderModel.findByIdAndUpdate(toRating,{totalRatings: newtotalRatings,avrRating: newAvrRating})
        ])

        if(!serviceRequestDoc || !ratingDoc || !serviceProviderDoc){
            return res.status(500).send({ result: "failed", message: "Error occured while uploading the changes Please try again." });
        }

        res.send({
            result: "success",
            message: "Review Updated. Thank you",
            updatedRating: newAvrRating,
            rating:ratingValue
        });
        
        
    } catch (err) {
        console.error(err);
        res.status(500).send({ result: "failed", message: err.message });
    }
})


ratingRouter.delete('app/service/review/delete',authenticateUser,async (req,res)=>{
    try {
        const {serviceRequestID} = req.body;
        if(!serviceRequestID)  return res.status(400).send({ result: "failed", message: "Bad Request! Missing data." });

        // check if the serviceRequest has review before it can be deleted
        const isServiceExist = await serviceRequestModel.findById(serviceRequestID);
        if(!isServiceExist || !isServiceExist.rating) return res.status(400).send({ result: "failed", message: "No service found or  is rated before, to delete." });

        const toRating = isServiceExist.to_Id;
        const deleteRating = isServiceExist.rating;

        const lastReviewData = await serviceProviderModel.findById(toRating);
        if (!lastReviewData) {
            return res.status(404).send({ result: "failed", message: "Could not find Service Provider." });
        }

        const newTotalNumberOfReviews = lastReviewData.totalNumberOfReviews - 1;
        const newtotalRatings = lastReviewData.totalRatings - deleteRating;
        const newAvrRating = newtotalRatings / newTotalNumberOfReviews;

        const [serviceRequestDoc, ratingDoc, serviceProviderDoc] = await Promise.all([
            serviceRequestModel.findByIdAndUpdate(serviceRequestID,{$unset:{rating: ""}},{new:true}),
            ratingModel.findByIdAndDelete(serviceRequestID),
            serviceProviderModel.findByIdAndUpdate(toRating,
                {
                    totalNumberOfReviews: newTotalNumberOfReviews,
                    totalRatings: newtotalRatings,
                    avrRating: newAvrRating
                },{new:true})
        ])

        if(!serviceRequestDoc || !ratingDoc || !serviceProviderDoc){
            return res.status(500).send({ result: "failed", message: "Error occured while deleting the rating Please try again." });
        }

        res.send({
            result: "success",
            message: "Review Deleted."
        });

    } catch (error) {
        console.error(err);
        res.status(500).send({ result: "failed", message: err.message });
    }
})

module.exports = ratingRouter;
