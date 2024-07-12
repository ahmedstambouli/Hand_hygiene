const express = require("express");
const HandAnalysis = require("../model/HandAnalysis");
const HandImage = require("../model/HandImage");



const router = express.Router();



//all analyse 
router.get("/all", async (req, res) => {
    const resultat= await HandImage.find().populate("hygieneStatus").exec()
    res.json({ results: resultat });
    });

//getparid
router.get("/analyse/:id", async (req, res) => {
    try
    {
        
        const analyse = await HandImage.findById(req.params.id).populate("hygieneStatus").exec();
        res.json({ analyse: analyse });
    }
    catch (err)
    {
        res.json({ message: "Analyse not found" });
        }
    
    });


//Number total of analyse
router.get("/totalanalyse", (req, res) => {
    HandAnalysis.countDocuments().then((total) => {
        res.json({ total: total });
    }).catch((err) => {
        res.json({ error: err });
    });

})

//Number Analysis of hand for today
router.get("/todayanalyse", async (req, res) => {
    const date = new Date();
    const todayStart = new Date(date.setHours(0, 0, 0, 0));  // Start of the day
    const tomorrowStart = new Date(todayStart).setDate(todayStart.getDate() + 1);  // Start of tomorrow
    const total = await HandImage.countDocuments({
        capturedate: {
            $gte: todayStart,
            $lt: new Date(tomorrowStart)
        }
    });
    res.json({ total });
})



// change le form date
const normalizeDate = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

//chercher par range
router.post("/totalanalysebydate", async (req, res) => {
    try {
        const date1 = new Date(req.body.date1);
        const date2 = new Date(req.body.date2);

        // Normalize dates
        const normalizedDate1 = normalizeDate(date1);
        const normalizedDate2 = normalizeDate(date2);
        normalizedDate2.setDate(normalizedDate2.getDate() + 1);  // Include the end date in the range

        // console.log('Normalized Dates:', normalizedDate1, normalizedDate2);

        if (isNaN(normalizedDate1.getTime()) || isNaN(normalizedDate2.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        const results = await HandImage.aggregate([
            {
                $match: {
                    capturedate: {
                        $gte: normalizedDate1,
                        $lt: normalizedDate2,
                    }
                }
            },
            {
                $lookup: {
                    from: 'handanalyses',  // Ensure this matches the collection name
                    localField: 'hygieneStatus',
                    foreignField: '_id',
                    as: 'hygieneStatusDetails'
                }
            },
            {
                $unwind: {
                    path: '$hygieneStatusDetails',
                    preserveNullAndEmptyArrays: true
                }
            }
        ]);

        res.json({ results: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});






module.exports = router;
