const express = require('express');
const app = express();
const cors = require('cors');
var jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;

// midleware:
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwapsgs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    await client.connect();
    console.log("Connected to MongoDB successfully!");

    try {
        const productCollection = client.db("critiqueDb").collection("products");
        const reviewCollection = client.db("critiqueDb").collection("reviews");

        // create JWT Token:
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            // console.log(token);
            res.send({ token });
        });

        // all products for product page:
        app.get('/products', async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);

        });

        // Search Product on home category:
        app.get('/products/:text', async (req, res) => {
            const searchText = req.params.text;
            const result = await productCollection.find({
                $or: [
                    { name: { $regex: searchText, $options: "i" } },
                    { category: { $regex: searchText, $options: "i" } }
                ],
            }).toArray();
            res.send(result);

        });
        // Filter and sort product on product page:
        
        app.get("/products", async (req, res) => {
            const price = req.query.price;
            const isTrue = req.query.isSort;
            console.log(price, isTrue)
            if (isTrue === "true") {
                const result = await productCollection.find({ price: price }).sort({ createdAt: -1 }).toArray();
                res.send(result);
                return;
            }
            const result = await productCollection.find({ price: price }).sort({ createdAt: 1 }).toArray();
            res.send(result);
        })
        
        // add review :
        app.post("/addReview", async (req, res) => {
            const review = req.body;
            review.createdAt = new Date();
            if (!review) {
                return res.status(404).send({ message: "invalid request" })
            }
            const result = await reviewCollection.insertOne(review);
            console.log(review);
            res.send(result)
        });
        // Get All Review:
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray();
            res.send(result);

        });




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error("Error:", error);
    }
};

// Run the application:
run().catch(console.error);

// Start the server:
app.get('/', (req, res) => {
    res.send('critique-corner is running');
});

app.listen(port, () => {
    console.log(`critique-corner is running on port:${port}`);
});