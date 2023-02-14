//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
require("dotenv").config(); 
const srvr = process.env.N1_KEY; 
const srvrCred = process.env.N1_SECRET; 
const mongoDB = "mongodb+srv://" + srvr + ":" + srvrCred + "@cluster0.8wcz7kl.mongodb.net/todolistDB?retryWrites=true&w=majority";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(mongoDB, {useNewUrlParser: true});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const defaultOne = new Item ({
  name: "This is your list"
});

const defaultTwo = new Item ({
  name: "Add using +"
});

const defaultItems = [defaultOne, defaultTwo];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function (error, results){
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(error, docs){
        if (error) { 
          console.log(error);
        } else {
          console.log(`Successfully saved items to DB`);
        }
      });
      res.redirect("/"); //after adding default items, redirect to root route, and will not find an empty collection
    } else {
      res.render("list", {listTitle: "Today", newListItems: results});
    }
  });
});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(error, foundList) {
    if(!error) {
      if (foundList) {
        res.render("list", {listTitle: customListName, newListItems: foundList.items});
      } else {
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName) //current route
      }
    }  
})
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list; //from button name attribute
  const item = new Item ({
    name: itemName
  })

  if (listName === "Today") {
  item.save();
  res.redirect("/")
  } else {
    List.findOne({name: listName}, function(error, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName)
    })
  }

});

app.post("/delete", function(req,res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
      Item.findByIdAndRemove(checkedItemId, function(err){
        if (!err) {
          console.log("Item deleted successfully!");
          res.redirect("/")
        }
      })
    } else {
      List.findOneAndUpdate ({name: listName} ,{$pull: {items: {_id: checkedItemId}}} , function(error, results) {
        res.redirect("/"+ listName)
      });
    }
})


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log(`Server started on port ${process.env.PORT}`);
});
