const express = require('express');
const app = express();
const PORT = process.env.PORT || 7070;
const mongoose = require('mongoose');
const User = require('./User');
const jwt = require('jsonwebtoken');
app.use(express.json());

const dbConnect = async () => {
    try {
        mongoose.set('strictQuery', false);
        mongoose.connect('mongodb://127.0.0.1:27017/auth_service');
        console.log('Auth DB connected successfully');
    } catch(error) {
        console.log(`Auth DB not connecting some error ${error}`);
    }    
}
dbConnect();

app.post('/auth/login', async (req,res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ message: "User doesnt exist"});
    } else {
        if (password !== user.password) {
            return res.json({ message: 'Password is incorrect'});
        }
        const payload = {
            email,
            name: user.name
        };
        jwt.sign(payload, 'secret', (err, token) => {
            if (err) console.log(err);
            else {
                return res.json({token: token});
            }
        });        
    }
});

app.post('/auth/register', async (req,res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.json({message : 'User already exist!!'});
    } else {
        const newUser = new User({
            name, email, password
        });
        newUser.save();
        return res.json(newUser);
    }

})
app.listen(PORT, () => {
    console.log(`Auth-Service at this port ${PORT}`);
});
