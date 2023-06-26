const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// jwt token verification 
const verifyJWT = (req, res, next)=> {
  const authorization = req.headers.authorization;
  if(!authorization){
    return res.status(401).send({error: true, message: 'unauthorized access 1'});
  }
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({error: true, message:'unauthorized access 2'})
    }
    req.decoded = decoded;
    next();
  })
}

app.get('/', (req, res) => {
  res.send('DIU Transport is running')
})
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qrtbble.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();


    const transportInfoCollection = client.db('diuTransport').collection('transportInfo');
    const busInfoCollection = client.db('diuTransport').collection('busInfo');
    const allBusInfoCollection = client.db('diuTransport').collection('allBusInfo');
    const driversCollection = client.db('diuTransport').collection('drivers');
    const usersCollection = client.db('diuTransport').collection('users');


    // users related apis
    // app.get('/users', verifyAdmin, async (req, res) => {
    //   const result = await usersCollection.find().toArray();
    //   res.send(result);
    // });


    app.post('/jwt', (req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '2h'})
      res.send({token});
    })
    // users related apis
    app.get('/users',async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });


    // is admin checking 
    app.get('/users/admin/:email', async(req, res)=>{
      const email = req.params.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      const result = {admin: user?.role==='admin'};
      res.send(result);
    })

    // creating user 
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await usersCollection.insertOne(user);
      console.log(result);
      res.send(result);
    });

    // making an user admin 
    app.patch('/users/admin/:id', async (req, res) => {
      const id = (req.params.id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //   get transport info 

    app.get('/transportInfo', async (req, res) => {
      const cursor = transportInfoCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //   get todays bus info 

    app.get('/busInfo', async (req, res) => {
      const cursor = busInfoCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    // to delete scheduled bus 
    app.delete('/busInfo/delete-todays-schedule/:id', async (req, res) => {
      const id = req.params.id;
      console.log("delete id :", id);
      const query = { _id: new ObjectId(id) }
      const result = await busInfoCollection.deleteOne(query);
      res.send(result);
    })

    // get todays bus info by route name 
    app.get('/busInfo/:routeName', async (req, res) => {
      const routeName = req.params.routeName;
      console.log(routeName);
      let query = {};
      query = { routeName: routeName }
      const result = await busInfoCollection.find(query).toArray();
      res.send(result);

    })
    // get todays bus info by id
    app.get('/update-busInfo/:id', async (req, res) => {
      const Id = req.params.id;
      console.log("id is ",Id);
      const query = { _id: new ObjectId(Id) }
      const result = await busInfoCollection.find(query).toArray();
      console.log(result);
      res.send(result);

    })
    // update todays bus info by id 

    app.patch('/update-busInfo/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedToy = req.body;
      console.log(updatedToy);

      const updateToy = {
        $set:
          updatedToy
      };
      const result = await busInfoCollection.updateOne(filter, updateToy);
      res.send(result);

    })
    // get all bus info 

    app.get('/allBusInfo', async (req, res) => {
      const cursor = allBusInfoCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })


    // get driver info 

    app.get('/drivers', async (req, res) => {
      const cursor = driversCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);



app.listen(port, () => {
  console.log(`DIU Transport is running on ${port}`)
})