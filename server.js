var express = require('express');
var mysql = require('./dbcon.js');
var app = express();
var async = require('async');
async.waterfall = require('async/waterfall');
var handlebars = require('express-handlebars').create({
  defaultLayout: 'home'
});

app.use(express.static('public'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


//Main route
//Grabs list of job names and industry names to populate Top Skills Needed dropdown boxes
app.get("/", function (req, res, next) {
  var context = {}

  var jobsQuery = "SELECT * FROM Jobs GROUP BY id"
  var industryQuery = "SELECT * FROM Industries GROUP BY id"

  async.parallel([
      function (parallel_done) {
        mysql.pool.query(jobsQuery, {}, function (err, results) {
          if (err) return parallel_done(err);
          context.job = results;
          parallel_done();
        });
      },
      function (parallel_done) {
        mysql.pool.query(industryQuery, {}, function (err, results) {
          if (err) return parallel_done(err);
          context.industry = results;
          parallel_done();
        });
      }
    ],
    function (err) {
      if (err) console.log(err);

      res.render('home', context)
    });
});

//What Fits My Skills post route
//Asks for JobsName and JobsDescription from the database based on results which are LIKE user input
//Jobs relevance needs to be implemented
app.post("/wfms", function (req, res, next) {
  var context = {}

  var jobsMatchQuery = 'SELECT Jobs.JobsName, Jobs.JobsDescription FROM Skills2Jobs  Join Jobs on Jobs.id = Skills2Jobs.JobID  Join Skills on Skills2Jobs.SkillID = Skills.id  where Skills.SkillsName like  ? ';
  var jobsQuery = "SELECT * FROM Jobs GROUP BY id"
  var industryQuery = "SELECT * FROM Industries GROUP BY id"

  async.parallel([
      function (parallel_done) {
        mysql.pool.query(jobsQuery, {}, function (err, results) {
          if (err) return parallel_done(err);
          context.job = results;
          parallel_done();
        });
      },
      function (parallel_done) {
        mysql.pool.query(industryQuery, {}, function (err, results) {
          if (err) return parallel_done(err);
          context.industry = results;
          parallel_done();
        });
      },
      function (parallel_done) {
        mysql.pool.query(jobsMatchQuery, [req.body.skill1], function (err, results) {
          if (err) return parallel_done(err);
          context.result = results;
          parallel_done();
        });
      }
    ],
    function (err) {
      if (err) console.log(err);

      res.render('home', context)
    });
});

app.use(function (req, res) {
  res.status(404)
  res.render("404")
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500)
  res.render("500")
})

const port = 8003;
app.set(port);
app.listen(port, () => {
  console.log(`Served piping hot at http://localhost:${port}`)
});