const express = require('express');
const app = express();
const PORT = process.env.PORT || 8081;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib/callback_api');
const isAuthenticated = require('../isAuthenticated');
const Product = require('./Product');
app.use(express.json());

var channel, connection;

const dbConnect = async () => {
    try {
        mongoose.set('strictQuery', false);
        mongoose.connect('mongodb://127.0.0.1:27017/prod_service');
        console.log('Product DB connected successfully');
    } catch(error) {
        console.log(`Product DB not connecting some error ${error}`);
    }    
}
dbConnect();

const rabbitConnect = () => {
    const amqpServer = 'amqp://localhost';
    amqp.connect(amqpServer, (error, connection) => {
        if (error) throw error;
        else {
            connection.createChannel(function(error, channel) {
                if (error) throw error;
                else { 
                        console.log(`Channel is created == ${channel}`); 
                        channel.assertQueue('PRODUCT');
                    }
            });
        }
    });
    
}
rabbitConnect();

app.post('/product/create', isAuthenticated, async (req,res) => {
    const { name, description, price } = req.body;
    const newProduct = new Product({
        name,
        description,
        price
    });
    newProduct.save();
    return res.json(newProduct);
});

app.post('/product/buy', isAuthenticated, async (req,res) => {
    const { ids } = req.body;
    const products = await Product.find({ _id : { $in : ids }});
    
    rabbitConnect().channel.sendToQueue('ORDER', Buffer.from(JSON.stringify(
        { 
            products,
            userEmail: req.user.email
        })        
    ));
});

app.listen(PORT, () => {
    console.log(`Product-Service at this port ${PORT}`);
});
