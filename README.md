# waytobe

How this all works:

1) Main route is "get('/'"...)
This loads the entire main page. It asks the database to hand it a list of all job and skill names. It uses these to populate the dropdown boxes for Top Skills Needed.

When someone enters data into the What Fits My Skills form (currently only the "Skill 1" box data is sent), the route that is called is app.post('/wfms'...)
This sends the data from Skill 1 to the database and asks for the skill ID associated with a query LIKE this. Courtney recommended we try LIKE to help us "fuzzy" search the database; i.e., we don't need EXACT MATCHING queries to get some results. However, my initial testing didn't show that this was all that great.
The /wfms route handles that request for info. It receives the response. And then it loads the HOME Handlebars view again.
Why?
Because in the Home handlebars view there is an {{#if result}} clause.
The data sent back from the server for the RESULTS REPORT is called "result." So when the handlebars template sees that "result" exists, it loads the data from result into a results section which is otherwise hidden.
A little javascript code at the bottom of the Home handlebars file checks to see if this results section has loaded. If it has, we auto scroll down to get it into view.

2) Main handlebars view is "home." 
The "home" view is the entire page excluding the navigation bar and decorative header. That can be found in views/layouts.
Handlebars templates handle the dropdown boxes which autopopulate.
Handlebars also handles displaying results.

2a) CSS Template is "Skeleton"
I've used this in the past and it's very simple. Or kind of simple.

http://getskeleton.com/

All the info you need is there. Some introduction below if you want it:

The basic hierarchy is this:
<div class = "container"> // This creates a centered "container" of a fixed width
<div class = "row">    // This establishes a horizontal element that spans the container
<div class = "twelve columns"> // After you've established a row, you start working with columns. 12 is the max.
So you could also do something like:
<div class = "two columns">
**code**
</div>
<div class = "six columns">
**code**
</div>
</div>  //end the row
<div class = "row"> // new row
**more divs...**


3) Input validator
This is a simple bit of javascript. There were a couple issues I found using the unit testing which I will correct today. Otherwise I think the input validator works as it ought to.

THINGS TO BE DONE
1) Double check input validator
2) Retrieve jobs relevance and relevance ranking from database
3) Implement "top skills needed" report //This should be easy!
4) Allow user to add more entry boxes for skills
5) Re-write the input validator to accomodate dynamically added skill input boxes
6) Get rid of education and job experience?
7) Figure out a good way to do the "what fits my skills" relevance rating
