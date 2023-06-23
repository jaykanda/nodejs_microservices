const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib/callback_api');
const isAuthenticated = require('../isAuthenticated');
const Order = require('./Order');
app.use(express.json());

var channel, connection;

const dbConnect = async () => {
    try {
        mongoose.set('strictQuery', false);
        mongoose.connect('mongodb://127.0.0.1:27017/order_service');
        console.log('Order DB connected successfully');
    } catch(error) {
        console.log(`Order DB not connecting some error ${error}`);
    }    
}
dbConnect();

async function rabbitConnect() {
    const amqpServer = 'amqp://localhost';
    amqp.connect(amqpServer, (error, connection) => {
        if (error) throw error;
        else {
            connection.createChannel(function(error, channel) {
                if (error) throw error;
                else { 
                        console.log(`Channel is created == ${channel}`); 
                        channel.assertQueue('ORDER');
                    }
            });
        }
    });
}

rabbitConnect().then(() => {
    channel.consume('ORDER', data => {
        const { products, userEmail } = JSON.parse(data.content);
        console.log(`Consuming by ORDER queue ${data}`);
    })
});


app.listen(PORT, () => {
    console.log(`Order-Service at this port ${PORT}`);
});
