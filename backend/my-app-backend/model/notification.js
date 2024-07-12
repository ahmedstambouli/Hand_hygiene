const mongoos =require("mongoose")
const Schema = mongoos.Schema;

const NotificationSchema=mongoos.Schema({
    message:{type:String},
    id_HandAnalysis:{type:Schema.Types.ObjectId,ref:"HandAnalysis"}

})

const notification =mongoos.model("Notification",NotificationSchema);
module.exports=notification;

