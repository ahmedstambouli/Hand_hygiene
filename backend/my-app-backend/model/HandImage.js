const mongoos =require("mongoose")
const Schema = mongoos.Schema;


const HandelImageshema= mongoos.Schema({
    capturedate:{type:Date},
    imagepath:{type:String},
    hygieneStatus:{type:Schema.Types.ObjectId,ref:"HandAnalysis"}


})

const HandelImage=mongoos.model("HandelImage",HandelImageshema);
module.exports=HandelImage;