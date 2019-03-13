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

  const jobsMatchQuery = repeat('SELECT Jobs.JobsName, Jobs.JobDescription FROM Skills2Jobs  Join Jobs on Jobs.id = Skills2Jobs.JobID  Join Skills on Skills2Jobs.SkillID = Skills.id  where Skills.SkillsName like ?;', 4);
  const jobsQuery = "SELECT * FROM Jobs GROUP BY id"
  const industryQuery = "SELECT * FROM Industries GROUP BY id"

  //Populate array with user input to send with SQL query
  let userInput = []

  userInput.push(req.body.skill1.toLowerCase())
  userInput.push(req.body.skill2.toLowerCase())
  userInput.push(req.body.skill3.toLowerCase())
  userInput.push(req.body.skill4.toLowerCase())

  async.waterfall([
      function getJobs(callback) {
        mysql.pool.query(jobsMatchQuery, userInput, function (err, results) {
          if (err) {
            console.log(err);
          } else {
            //Save current result 
            console.log("GETJOBS RESULTS")
            console.log(JSON.stringify(results))
            console.log(results)

            //Save user inputs for later
            context.userInput = userInput

            //Save job descriptions for later
            jobDescriptions = new Map
            for (eachEntry of results) {
              for (detail of eachEntry) {
                jobDescriptions.set(detail.JobsName.toLowerCase(), detail.JobDescription.toLowerCase())
              }
            }

            //If only one job result is returned, it breaks the rest of this.
            //If this is the case, we stop here and return that single job.
            if (onlyOneJobReturned(results)) {
              context.result = results[0]
              res.render('home', context)
              return

            } else {

              //Grab the name of each job from the results
              jobsArray = []

              for (eachRow of results) {
                for (job of eachRow) {
                  jobsArray.push(job.JobsName.toLowerCase())
                }
              }

              callback(err, jobsArray, results);
            }
          }
        })
      },

      function getMatchingSkills(jobsArray, results, callback) {
        /* Testing 
    console.log(Object.entries(results))
    console.log("KEYS")
    console.log("VALUES")
    console.log("OWN PROPERTY NAMES")
    console.log(Object.getOwnPropertyNames(results))
    console.log(Object.values(results[0]))
    */

        //This query will get us the skills which match each job name
        //Create a string which will query as many times as there are jobs
        let skillsQuery = repeat("SELECT Skills.SkillsName FROM Skills2Jobs Join Jobs on Jobs.id = Skills2Jobs.JobID  Join Skills on Skills2Jobs.SkillID = Skills.id  where Jobs.JobsName = ?;", jobsArray.length)

        mysql.pool.query(skillsQuery, jobsArray, function (err, results) {
          if (err) {
            console.log(err);
          } else {

            //Grab the name of each skill from the results
            //For each batch of skills, create an array, then push that array to skillsArray 
            skillsArray = []

            for (eachRow of results) {
              subArray = new Array
              for (skill of eachRow) {
                subArray.push(skill.SkillsName.toLowerCase())
              }
              skillsArray.push(subArray)
            }

            //Now we will create a map, which will allow us to easily reference a job and its associated skills            
            skillsMap = new Map

            counter = 0
            for (eachJob of jobsArray) {
              skillsMap.set(eachJob, skillsArray[counter])
              counter++
            }

            //Finally, we will generate a job relevance rating for each job
            //We stored the user input in "context.userInput" earlier (it's an array)
            //We will use that here

            userInput = context.userInput
            //let relevanceJSON = {}
            relevanceMap = new Map

            for (const [key, value] of skillsMap) {
              counter = 0
              console.log("ENTRY")
              for (skill of userInput) {
                if (skill) {
                  if (value.includes(skill)) {
                    counter++
                  }
                  relevanceMap.set(key, counter)
                }
              }
            }

            //Package job name, job description, and relevance rating
            finalResult = JSON.parse(JSON.stringify(addRelevanceRating(jobDescriptions, relevanceMap)))
            context.result = finalResult

            callback(err, results);
          }
        })
      },

      //Grab job names and industries to populate Top Skills Needed dropdown
      function parallelFunc(results, callback) {
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
          ],
          function asyncCallback(err, results) {
            if (err) {
              console.log(err);
            } else {
              callback(err, results);
            }
          });
      }
    ],
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        res.render('home', context);
      }
    });
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

const port = 8004;
app.set(port);
app.listen(port, () => {
  console.log(`Served piping hot at http://localhost:${port}`)
});

//Helper functions

repeat = function repeat(str, numTimes) {
  retString = ''
  for (i = 0; i < numTimes; i++) {
    retString += str
  }
  return retString
}


//Helper function
//Implement JS ES8 Object.entries() function via polyfill
Object.entries = function (obj) {
  var ownProps = Object.keys(obj),
    i = ownProps.length,
    resArray = new Array(i); // preallocate the Array

  while (i--)
    resArray[i] = [ownProps[i], obj[ownProps[i]]];
  return resArray;
};

//Check if only 1 job is returned by user search
function onlyOneJobReturned(obj) {

  nullCounter = 0
  numKeys = Object.keys(obj).length
  for (key of obj) {
    if (key.length == 0) {
      nullCounter += 1
    }
  }

  if (numKeys - nullCounter == 1) {
    return true
    console.log("ONLY 1 JOB")
  } else {
    return false
  }
}

function addRelevanceRating(nameObj, relevanceObj) {
  let outerArray = []
  var jName
  var jDescription
  for (const [key, value] of nameObj) {

    jName = key
    jDescription = value
    jRelevance = relevanceObj.get(key)

    var obj = new Object()
    obj.JobsName = jName
    obj.JobDescription = jDescription
    obj.JobsRelevance = jRelevance

    outerArray.push(obj)
  }

  return outerArray

}