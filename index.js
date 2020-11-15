const express = require("express");
const fileupload = require("express-fileupload");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config({ path: "./config/.env" });
const cors = require("cors");
const bodyParser = require("body-parser");
const { ReplSet } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(fileupload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aquaz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

app.get("/", (req, res) => {
  res.send("hello world");
});

const client = new MongoClient(uri, { useUnifiedTopology: true });
client.connect((err) => {
  const allrenthousedatacollection = client
    .db("Apartment-hunt")
    .collection("allrenthousedata");

  const allorderscollection = client
    .db("Apartment-hunt")
    .collection("allorders");

  //get orders by email
  app.get("/getorderbyemail/:email", (req, res) => {
    const email = req.params.email;
    if (email) {
      allorderscollection.find({ email: email }).toArray((err, documents) => {
        if (documents) {
          res.send(documents);
        }
        if (err) {
          res.send(err);
        }
      });
    } else {
      res.send("email was not send ");
    }
  });
  //get all orders
  app.get("/getallorders", (req, res) => {
    allorderscollection.find({}).toArray((err, documents) => {
      if (documents) {
        res.send(documents);
      }
      if (err) {
        res.send(err);
      }
    });
  });
  //search rent house
  app.get("/getrenthousebysearch", (req, res) => {
    const search = req.query.search;
    allrenthousedatacollection
      .find({ title: { $regex: search } })
      .toArray((err, documents) => {
        if (documents) {
          res.send(documents);
        }
        if (err) {
          res.send(err);
        }
      });
  });

  // add rent house
  app.post("/addrenthouse", (req, res) => {
    try {
      const file = req.files.file;
      const title = req.body.title;
      const location = req.body.location;
      const price = req.body.price;
      const numberOfBathroom = req.body.numberOfBathroom;
      const numberOfRoom = req.body.numberOfRoom;
      if (
        file &&
        title &&
        location &&
        price &&
        numberOfBathroom &&
        numberOfRoom
      ) {
        const newimg = file.data;

        const encodedimg = newimg.toString("base64");

        var image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(encodedimg, "base64"),
        };

        allrenthousedatacollection
          .insertOne({
            title,
            location,
            price,
            numberOfBathroom,
            numberOfRoom,
            image,
          })
          .then((r) => {
            console.log(r.insertedCount > 0);

            res.send(r.insertedCount > 0);
          });
      } else {
        res.send("Please send all neccessary data");
      }
    } catch (error) {
      console.log(error);
    }
  });

  console.log("db connection");
});

app.listen(port, () => {
  console.log(`running at ${port}`);
});
