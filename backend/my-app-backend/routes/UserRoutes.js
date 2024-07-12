const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const admin = require("../model/Administarature")
const router = express.Router();



//register
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please fill all the fields" })
        }
        const userExist = await admin.findOne({ email });
        // Check if user exists
        if (userExist) {
            return res.status(400).json({ error: "User already exist" })
        }
        const user = new admin({
            name, email, password
        })
        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        //user register 
        await user.save();
        res.status(200).json({ status: 'ok',message: "User registered successfully" })
        // Return jsonwebtoken
    const payload = {
        user: {
          id: user.id,
          name:user.name,
          email:user.email,
        },
      };
  
      jwt.sign(
        payload,
        "secret",
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Something went wrong" })
    }
})

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user exists
      let user = await admin.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: "Invalid Credentials" });
      }
  
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid Credentials" });
      }
  
      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
          name:user.name,
          email:user.email,
          
        },
      };
  
      jwt.sign(
        payload,
        "secret",
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  });



module.exports = router;
