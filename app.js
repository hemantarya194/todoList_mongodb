
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { getDate, getDay } from "./date.js";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const dateValue = getDate();
const dayValue = getDay();

mongoose.connect('mongodb+srv://admin_hemant:testweb2002@cluster0.lhf4h9x.mongodb.net/todoListDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to the database');
});

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Joy',
});
const item2 = new Item({
  name: 'Lila',
});
const item3 = new Item({
  name: 'Rox',
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name : String,
  items : [itemsSchema]
}

const List = mongoose.model("List", listSchema);

const day = dateValue

app.get("/", function(req, res) {

  async function retrieveAndRenderItems() {
  try {
    const foundItems = await Item.find({});

    if(foundItems.length === 0) {
      Item.insertMany(defaultItems);
      console.log("Successfully added items in the DB");
      res.redirect("/");
    }

    else{
      
      res.render("list", { listTitle: day, newListItems: foundItems });
    }

  } catch (err) {
    console.error(err);
  }
}

retrieveAndRenderItems();

});

app.get("/:customListName", async (req, res) => {
  try {
    const customListName = req.params.customListName;

    const existingList = await List.findOne({ name: customListName });

    if (existingList) {
      res.render("list", { listTitle: existingList.name, newListItems: existingList.items });
    } else {
      const list = new List({
        name: customListName,
        items: defaultItems 
      });
      
      await list.save();

      console.log("List created successfully.");

      res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating or rendering the list.");
  }
});

  
app.post("/", async (req, res) => {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === day) {
      await item.save();
      console.log("Successfully added item.");
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      console.log("Successfully added item to the custom list.");
      res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding the item.");
  }
});


app.post("/delete", async (req, res) => {
  const checkedboxItem = req.body.checkbox;
  const listName = req.body.listName;

  try {
    const deletedItem = await Item.findByIdAndRemove(checkedboxItem);

    if (deletedItem) {
      res.redirect("/");
    } 

    else{

      const updatedList = await List.findOneAndUpdate(
        { name: listName },
        { $pull: { items: {_id : checkedboxItem} } }
      );
      if (updatedList) {
        res.redirect("/" + listName)
        
      } else {
        console.log("List not found.");
      }
    }
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting the item.");
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
