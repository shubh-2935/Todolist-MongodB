require("dotenv").config();
const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const morgan = require("morgan") 
const methodOverride = require("method-override")

const app = express();
const PORT = process.env.PORT;
 
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(morgan("tiny"));
app.use(methodOverride("_method"));

mongoose.set("strictQuery", false);
const connectDB = async()=> {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch(error){
        console.log(error);
        process.exit(1);
    }
}

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const Item1 = new Item({
    name: "Welecome to your Todo List!" 
});

const Item2 = new Item({
    name: "Hit the + button to add new item" 
});

const Item3 = new Item({
    name: "<-- Hit this to delete an item" 
});

const itemArray = [Item1, Item2, Item3];

const listSchema = mongoose.Schema({
    name: String,
    items: [itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
    try {
      const allItems = await Item.find({});
      if (allItems.length === 0) {
        await Item.insertMany(itemArray);
        console.log("Default 3 values inserted in DB");
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newElement: allItems });
      }
    } catch (err) {
      console.log(err);
    }
  });
  

app.post("/", async function(req, res) {
    try {
      const value = req.body.newItem;
      const listName = req.body.list;
  
      const itemDocument = new Item({
        name: value
      });
  
      if (listName === "Today") {
        await itemDocument.save();
        res.redirect("/");
      } else {
        const foundList = await List.findOne({ name: listName });
        foundList.items.push(itemDocument);
        await foundList.save();
        res.redirect("/" + listName);
      }
    } catch (err) {
      console.log(err);
    }
  });
  

app.post("/delete", async function(req, res) {
    try {
        const itemId = req.body.checkbox;
        const listName = req.body.listName;

        if (listName === "Today") {
            await Item.findByIdAndRemove({ _id: itemId });
            res.redirect("/");
        } 
        else {
            const value = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: itemId } } }
            );
            res.redirect("/" + listName);
        }
    } 
    catch (err) {
        console.log(err);
    }
});
  

app.get("/:customListName", async function(req, res) {
    try {
        const customListName = _.capitalize(req.params.customListName);

        const value = await List.findOne({ name: customListName });

        if (value) {
            res.render("list", { listTitle: value.name, newElement: value.items });
        }
        else {
            const list = new List({
                name: customListName,
                items: itemArray
            });

            await list.save();
            res.redirect("/" + customListName);
        }
    } 
    catch (err) {
        console.log(err);
    }
});

connectDB().then(()=> {
    app.listen(PORT, () => {
        console.log("Listening on port");
    })
})  
