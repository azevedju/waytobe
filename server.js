var express = require('express');
var mysql = require('./dbcon.js');
var app = express();
var async = require('async');
async.waterfall = require('async/waterfall');
var handlebars = require('express-handlebars').create({
  defaultLayout: 'home'
});

//app.use(express.static(__dirname + '/public'));
app.use(express.static('public'));

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

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


app.post("/wfms", function (req, res, next) {
  var context = {}

  var jobsMatchQuery = 'SELECT Skills.SkillsName, Jobs.JobsName FROM Skills2Jobs  Join Jobs on Jobs.id = Skills2Jobs.JobID  Join Skills on Skills2Jobs.SkillID = Skills.id  where Skills.SkillsName like  ? ';
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

app.get("/getSkillNames", function (req, res, next) {
  getSkillNames(req, res, next);
})


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

function getAllJobs(req, res, next) {
  mysql.pool.query("SELECT * FROM Jobs GROUP BY id", function (err, rows, fields) {
    if (err) {
      next(err)
      return
    } else {
      res.send(rows);
    }
  })
}

function getAllSkills(req, res, next) {
  mysql.pool.query("SELECT * FROM Skills GROUP BY id", function (err, rows, fields) {
    if (err) {
      next(err)
      return
    } else {
      res.send(rows);
    }
  })
}

function getSkillNames(req, res, next) {
  mysql.pool.query("SELECT SkillsName FROM Skills", function (err, rows, fields) {
    if (err) {
      next(err)
      return
    } else {
      res.send(rows);
    }
  })
}

function getAllIndustries(req, res, next) {
  mysql.pool.query("SELECT * FROM Industries GROUP BY id", function (err, rows, fields) {
    if (err) {
      next(err)
      return
    } else {
      res.send(rows);
    }
  })
}