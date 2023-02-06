const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()

// app
const app = express()
const port = process.env.PORT || 5001

// middleware
app.use(cors())
app.use(express.json())

function verifyJwt(req, res, next) {
  const authHeader = req.headers.authorization
  // console.log('insitd veriftJwt ', authHeader)

  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized Access' })
  }

  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' })
    }

    // console.log('decoded', decoded)
    req.decoded = decoded
    next()
  })
}

// mongodb server
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g65yn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

const dataBaseConnecting = async () => {
  try {
    await client.connect()
    const serviceCollection = client.db('geniusCar').collection('service')
    const orderCollection = client.db('geniusCar').collection('order')

    // all services
    app.get('/services', async (req, res) => {
      const query = {}
      const cursor = serviceCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    // post

    app.post('/login', async (req, res) => {
      const user = req.body
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      })

      res.send({ accessToken })
    })

    // only one service
    app.get('/services/:id', async (req, res) => {
      const { id } = req.params
      const query = { _id: ObjectId(id) }
      const result = await serviceCollection.findOne(query)

      res.send(result)
    })

    // post one service
    app.post('/service', async (req, res) => {
      const newService = req.body
      const result = await serviceCollection.insertOne(newService)
      res.send(result)
    })

    // delete one service
    app.delete('/services/:id', async (req, res) => {
      const { id } = req.params
      const query = { _id: ObjectId(id) }
      const result = await serviceCollection.deleteOne(query)

      res.send(result)
    })

    // order Collection Api

    // get
    app.get('/order', verifyJwt, async (req, res) => {
      const decodedEmail = req.decoded?.email
      console.log(decodedEmail)
      const { email } = req.query
      if (email === decodedEmail) {
        const query = { email }
        const curser = orderCollection.find(query)
        const userOrder = await curser.toArray()
        res.send(userOrder)
      } else {
        res.status(403).send({ message: 'Forbidden Accesse' })
      }
    })

    // post
    app.post('/order', async (req, res) => {
      const orderInfo = req.body
      const postedOrder = await orderCollection.insertOne(orderInfo)

      res.send(postedOrder)
    })
  } finally {
    console.log('db connect')
  }
}

dataBaseConnecting().catch(console.dir)

// handle route
app.get('/', (req, res) => {
  res.send('all ok')
})

// letsen to port
app.listen(port, () => {
  console.log('all ok')
})
