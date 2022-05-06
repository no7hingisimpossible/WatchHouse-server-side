const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m6aha.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const inventoryCollection = client.db('inventory').collection('inventories')
        console.log('db connected');

        // getting all items

        app.get('/inventories', async (req, res) => {
            const query = {}
            const cursor = inventoryCollection.find(query)
            const inventory = await cursor.toArray()
            res.send(inventory)
        })

        // getting items for specific id

        app.get('/inventories/:id', async (req, res) => {
            const id = req.params;
            const query = { _id: ObjectId(id) }
            const result = await inventoryCollection.findOne(query)
            res.send(result);
        })

        // Upading inventory

        app.put('/inventories/:id', async (req, res) => {
            const id = req.params;
            
            const newQty = req.body;
            console.log(newQty);
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateQty = {
                $set: {
                    qty: newQty.newQty
                },
            };
            const result = await inventoryCollection.updateOne(filter, updateQty, options);
            res.send({success: 'Your item delivered'})

        })

        // Deleting item from the inventory

        app.delete('/inventories/:id', async(req, res) => {
            const id = req.params;
            const query = {_id: ObjectId(id)}
            console.log(id);
            const result = await inventoryCollection.deleteOne(query)
            res.send(result)
        })
        
        // Add items

        app.post('/inventories', async(req, res) => {
            const addedItem = req.body 
            const tokenInfo = req.headers.authorization
            const [email, accessToken] = tokenInfo.split(" ")
            
            const decoded = verifyToken(accessToken)
            
            if(email === decoded.email){
                const result = await inventoryCollection.insertOne(addedItem)
                res.send({success : 'Product uploaded successfully'})
            }else{

                res.send({success : 'Unauthorised Access'}); 
            }
        })

        // Getting items through Emails

        app.get('/inventory', async(req, res)=> {
            const email = req.query.email;
            const query = {email: email};
            console.log(query);
            const cursor = inventoryCollection.find(query);
            const userItems = await cursor.toArray();
            res.send(userItems);
            
        })
        app.post('/login', async(req, res)=>{
            const email = req.body;
            const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET);
            console.log(email);
            res.send({token})
        })

        // Deleting user added item

        app.delete('/inventory/:id', async(req, res)=>{
            const id = req.params;
            const query = {_id: ObjectId(id)}
            console.log(id);
            const result = await inventoryCollection.deleteOne(query)
            res.send(result)
        })
        


    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World')
})
app.listen(port, () => {
    console.log("Listening to Port", port);
})
function verifyToken(token){
    let email;
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
        if(err){
            email = 'Invalid Email'
        }
        if(decoded){
            console.log(decoded);
            email = decoded
        }
      });
      return email 
}