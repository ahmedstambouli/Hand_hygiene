const mongoos =require("mongoose")

const HandAnalysisShema=mongoos.Schema({
    imageId:{type:String},
    clean:{type:Boolean},
    dirt_percentage:{type:Number},
    message:{type:String},
    describe:{type:String},
    number_hand:{type:String},
    Condition_of_the_Hand:{type:String},
    Details_and_Observations:{type:String},
    Possible_Interpretations:{type:String},

});
const HandAnalysis =mongoos.model("HandAnalysis",HandAnalysisShema);
module.exports=HandAnalysis;