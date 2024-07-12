const mongoos =require("mongoose")

const AdministaratureSchema=mongoos.Schema({
    name:{type:String},
    email:{type:String},
    password:{type:String}

}) 

const Administarature =mongoos.model("Administarature",AdministaratureSchema);
module.exports = Administarature;