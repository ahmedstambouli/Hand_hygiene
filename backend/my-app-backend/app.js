const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const cors = require('cors');  // Import du package CORS
const { v4: uuidv4 } = require('uuid');  // Importer la fonction pour générer un UUID

const userRoutes = require("./routes/UserRoutes");
const statistique = require("./routes/Statistique");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const HandelImage = require("./model/HandImage");
const HandAnalysis = require("./model/HandAnalysis");
const Notification = require("./model/notification"); // Ensure Notification is imported
const app = express();
dotenv.config(); // Load environment variables

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    console.error(`Uploads directory does not exist: ${uploadDir}`);
    process.exit(1);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = uuidv4();  // Générer un identifiant unique
        const ext = path.extname(file.originalname);  // Obtenir l'extension du fichier
        cb(null, `${uniqueSuffix}${ext}`);  // Créer le nom du fichier avec l'extension
    }
});

const upload = multer({ storage: storage });
const genAI = new GoogleGenerativeAI("AIzaSyDhV18gUmtSxhXe2_coPMWqs2R46iQnNUs");

// Configure CORS to allow requests from http://localhost:3001
app.use(cors({
    origin: 'http://localhost:3001',  // Autoriser cette origine
    methods: 'GET,POST,PUT,DELETE',  // Méthodes autorisées
    allowedHeaders: 'Content-Type,Authorization'  // En-têtes autorisés
}));

app.use(express.json());

//methode ajouter photo dons bas de donner et analyser 
app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {



        //gemini ia 
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        //Is the hand clean and I want the percentage of dirt according to approximation and I want it in json format and format json :clean,dirt_percentage,message,description,number_hand,Rings
        //const prompt = "Is the hand clean and I want the percentage of dirt according to approximation and I want it in json format and format json :clean,dirt_percentage,message";
        const prompt = "describe this picture and Is the hand clean and I want the percentage of dirt according to approximation and I want it in json format and format json : clean:boolean,dirt_percentage:number,message,describe ,number_hand,Condition_of_the_Hand,Details_and_Observations,Possible_Interpretations"
        const imageFilePath = req.file.path;
        const imageData = fs.readFileSync(imageFilePath);
        const base64Image = Buffer.from(imageData).toString("base64");

        const image = {
            inlineData: {
                data: base64Image,
                mimeType: "image/png",
            },
        };

        const result = await model.generateContent([prompt, image]);
        const responseText = result.response.text();
        const cleanedResponseText = responseText.replace(/```json|```/g, '').trim();
        const jsonResponse = JSON.parse(cleanedResponseText);

        res.json(jsonResponse);

        const date = new Date();

        console.log(jsonResponse);


        const hanAnlays = new HandAnalysis({
            //imageId: jsonResponse.imageId, // Assurez-vous que cette propriété existe dans la réponse JSON
            clean: jsonResponse.clean,
            dirt_percentage: jsonResponse.dirt_percentage,
            message: jsonResponse.message,
            describe: jsonResponse.describe,
            number_hand: jsonResponse.number_hand,
            Condition_of_the_Hand: jsonResponse.Condition_of_the_Hand,
            Details_and_Observations: jsonResponse.Details_and_Observations,
            Possible_Interpretations: jsonResponse.Possible_Interpretations,

        })
        await hanAnlays.save();


        const handImage = new HandelImage({
            capturedate: date,
            imagepath: req.file.filename,
            hygieneStatus: hanAnlays._id
        });
        await handImage.save(); // Save image info to MongoDB

        console.log(jsonResponse.clean);


        const notification = new Notification({
            message: jsonResponse.message,
            id_HandAnalysis:hanAnlays._id
            

        });
        await notification.save();










    } catch (error) {
        console.error("Error during image upload and AI processing:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});



app.get("/api/search-image/:filename", (req, res) => {
    try {
        // Get the filename from the route parameters
        const { filename } = req.params;
        if (!filename) {
            return res.status(400).json({ error: "File name is required" });
        }

        // Construct the full path to the file
        const filePath = path.join(uploadDir, filename);

        // Check if the file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // File not found
                res.status(404).json({ error: "File not found" });
            } else {
                // File found, send the file
                res.sendFile(filePath);
            }
        });
    } catch (error) {
        console.error("Error during image retrieval:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




// Routes
app.use("/api/user", userRoutes);
app.use("/api/statistique",statistique)

//route par default
app.get("/", (req, res) => {
    res.send("Welcome to my website");
});




//cette écriture paramètre de base de données et port de cette serveure  
const port = process.env.PORT || 3000;
const mongoUrl = process.env.MONGO_URL;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Database connected");
        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Error connecting to database:", err);
    });
