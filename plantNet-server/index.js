require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')

const port = process.env.PORT || 9000
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.y6uow.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {
    // collections
    const userCollection = client.db("PlantDB").collection("user");
    const plantCollection = client.db("PlantDB").collection("plant");
    const orderCollection = client.db("PlantDB").collection("order");

    // add user info while login
    app.post('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const isAvailable = await userCollection.findOne(query);
      if (isAvailable) {
        return res.send({ isAvailable });
      }
      const userData = req.body;
      const result = await userCollection.insertOne({ ...userData, timestamp: Date.now(), role: "customer" });
      res.send(result)
    })

    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // add new plant data to db
    app.post('/addPlants', verifyToken, async (req, res) => {
      const data = req.body;
      const result = await plantCollection.insertOne(data);
      res.send(result);
    })

    // add Purchase data to db
    app.post('/order', verifyToken, async (req, res) => {
      const data = req.body;
      const result = await orderCollection.insertOne(data);
      res.send(result);
    })

    // Manage plant quantity
    app.patch('/plants/quantity/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const { quantityToUpdate, status } = req.body
      const filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $inc: { quantity: -quantityToUpdate },
      }
      if (status === 'increase') {
        updateDoc = {
          $inc: { quantity: quantityToUpdate },
        }
      }
      const result = await plantCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // cancel order 
    app.delete('/cancelOrder/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const order = await orderCollection.findOne(filter);
      if (order.status === "shipped") {
        return res.status(404).send({ message: "order already shipped" })
      }
      const result = await orderCollection.deleteOne(filter);
      res.send(result);
    })

    // become a seller re
    app.patch('/becomeSeller/:email', async (req, res) => {
      const email = req.params.email;
      const filter = { email: email }
      const alreadyApplied = await userCollection.findOne(filter);
      if (alreadyApplied.status === "requested") {
        return res.status(409).send('You have already requested, wait for some time.')
      }
      const updateStatus = {
        $set: {
          status: "requested",
        }
      }
      const result = await userCollection.updateOne(filter, updateStatus)
      res.send(result);
    })

    // my order list
    app.get('/myOrder/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "customer.email": email };
      const result = await orderCollection.aggregate([
        {
          $match: query,
        },
        {
          $addFields: {
            plantID: { $toObjectId: '$plantID' },
          },
        },
        {
          $lookup: {
            from: 'plant',
            localField: 'plantID',
            foreignField: '_id',
            as: 'plants',
          },
        },
        {
          $unwind: '$plants'
        },
        {
          $addFields: {
            name: "$plants.name",
            image: "$plants.imageUrl",
            category: "$plants.category",
          },
        },
        {
          $project: {
            plants: 0
          }
        }
      ]).toArray();
      res.send(result);
    })

    // get all the plant data from db
    app.get('/allPlants', async (req, res) => {
      const result = await plantCollection.find().toArray();
      res.send(result);
    })
    // get a single plant data
    app.get('/plants/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await plantCollection.findOne(filter);
      res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})
