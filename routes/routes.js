const express = require("express");
const app = express.Router();
const db = require('../models/')

var axios = require("axios");
var cheerio = require("cheerio");

app.get("/", (req, res) => {
  res.render('index', {});
});

app.get("/scrape", function (req, res) {
  console.log("scraping");
  axios.get("https://thehackernews.com/").then(function (response) {
    var $ = cheerio.load(response.data);
    $("div div").each(function (i, element) {
      var result = {};
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
        result.author = $(this)
        .children("a")
        .attr("span");

        db.Scrape.create(result)
        .then(function (dbArticle) {
          res.redirect("/scrapes");
          console.log(dbArticle);
        })
        .catch(function (err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });
    });
    console.log("scrape is done");
  });
});

// Route for getting all scraped Articles from the db and displaying in articles.handlebars 
app.get("/scrapes", function (req, res) {
  console.log("app.get/scrapes");
  db.Scrape.find({})
    .then(function (data) {
      var results = {
        articles: data,
        saved:false
      }
      console.log(data[0].title);
      console.log(data[0].id);
      res.render('articles', results);
    })
    .catch(function (err) {
      res.json(err);
    });
});


// Route for getting all Saved Articles from the db and displaying in articles.handlebars 
app.get("/articles", function (req, res) {
  console.log("app.get/articles");

  var saved = true;
  db.Article.find({})
    .then(function (data) {
      var results = {
        articles: data,
        saved: true
      }
      
      console.log(data[0].title);
      console.log(data[0].id);

      res.render('articles', results);
    })
    .catch(function (err) {
      res.json(err);
    });
});

//route for saving article
app.post("/articles/", function (req, res) {
  db.Article.create(req.body)
    .then(function (data) {

      console.log(data);
      res.send(data);
    })
    .catch(function (err) {
      return res.json(err);
    });
});

// Route for grabbing a One Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  console.log("APP.GET /articles/:id populated");
  db.Article.findOne({
      _id: req.params.id
    })
    .populate("notes")
    .then(function (data) {
      console.log(data);
      var results = {
        article: data,
        note: data.notes
      }
      res.render('article', results);
    })
    .catch(function (err) {
      res.json(err);
    });
});

// Route for saving an Article's associated Note
app.post("/notes/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  console.log("/notes/:id to POST a note to an article");
  db.Note.create(req.body)
    .then(function (dbNote) {
   
      return db.Article.findOneAndUpdate({
        _id: req.params.id
      }, {
        $push: {
          notes: dbNote._id
        }
      }, {
        new: true
      });

    })
    .then(function (data) {
      var results = {
        note: data
      }
      res.render('article', results);
    })
    .catch(function (err) {
      res.json(err);
    });
});

//route for update an articles note
app.put("/notes/:id", function (req, res) {
  console.log("updating the note");
  db.Note.update({
      "_id": req.params.id
    }, {
      $set: {
        "title": req.body.title,
        "body": req.body.body
      }
    },
    function (error, edited) {
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        console.log(edited);
        var results = {
          note: edited
        }
        res.render('article', results.edited);
      }
    });
});


//route for del of note
app.delete("/notes/:noteid/:articleid", function (req, res) {
  console.log("first removing the note from article");

  db.Article.update({
      "_id": req.params.articleid
    }, {
      "$pull": {
        "notes": req.params.noteid
      }
    },
    function (error, deleted) {
      if (error) {
        console.log(error);
        res.send(error);
      } else {
        console.log("Note was removed from article");
        db.Note.findByIdAndRemove(req.params.noteid, function (err, removed) {
          if (err)
            res.send(err);
          else
            res.json({
              removed: 'Note was Deleted!'
            });

        }); //end findByIdAndRemove
      } //end else
    }); //end DBarticle update

}); //endapp.delete

/// Route - Article by id, populate it with it's note
app.get("/notes/:id", function (req, res) {
  console.log("APP.GET /notes/:id");
  db.Note.findOne({
      _id: req.params.id
    })
    .then(function (data) {
      console.log(data);
      console.log(data);
      res.json(data);
    })
    .catch(function (err) {
      res.json(err);
    });
});
module.exports = app;