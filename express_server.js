const express = require('express');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const usersDatabase = './data/users.json';
const urlsDatabase = './data/urlDatabase.json';

const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: [")J@NcRfUjWnZr4u7"]
}));
app.use(methodOverride('_method'));
app.use(cookieParser());

// constructor function for new User
function User(id, email, password, secQuestion, secAnswer) {
  this.id = id;
  this.email = email;
  this.password = password;
  this.secQuestion = secQuestion;
  this.secAnswer = secAnswer;
};

// constructor function for new URL
function newURL(longURL, userID, visits) {
  this.longURL = longURL;
  this.userID = userID;
  this.visits = visits
};

function newVisit(timestamp, visitor_id) {
  this.timestamp = timestamp;
  this.visitor_id = visitor_id;
};

app.use(express.urlencoded({ extended: true }));

//--- GET START ---//

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html\n');
});

// GET request for URL index
app.get('/urls', (req, res) => {
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  // return all URLs matching userID to cookie id
  const userURL = urlsForUser(req.session.user_id, urlsDatabase);

  const templateVars = {
    urls: userURL,
    user: userParsed[req.session.user_id]
  };

  res.render('urls_index', templateVars);
});

// GET request for New URL
app.get('/urls/new', (req, res) => {
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);
  const templateVars = {
    user: userParsed[req.session.user_id]
  }

  // if cookie is null redirect to /login
  if (!req.session.user_id) {
    res.redirect('/login');
    return;
  }

  res.render('urls_new', templateVars);
});

// GET request for ID/edit page
app.get('/urls/:id', (req, res) => {
  const urlList = fs.readFileSync(urlsDatabase);
  const urlParsed = JSON.parse(urlList);
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);
  
  const templateVars = {
    id: req.params.id,
    longURL: urlParsed[req.params.id].longURL,
    user: userParsed[req.session.user_id],
    pageView: Object.keys(urlParsed[req.params.id].visits).length,
    visits: urlParsed[req.params.id].visits
  }
  
  if (!req.session.user_id) {
    res.send('You must log in. Click <a href="/login">here</a> to login.')
    return;
  }
  if (urlParsed[req.params.id].userID !== req.session.user_id) {
    res.send("You do not own this short URL. Click <a href='/urls'>here</a> to return.");
    return;
  }

  res.render("urls_show", templateVars)
});

// GET request for redirect to longURL
app.get('/u/:id', (req, res) => {
  const urlList = fs.readFileSync(urlsDatabase);
  const urlParsed = JSON.parse(urlList);

  const longURL = urlParsed[req.params.id].longURL;
  if (longURL) {
    if (!req.cookies[req.params.id]) {
      res.cookie(req.params.id, 1);

    } else {
      let viewCount = Number(req.cookies[req.params.id]);
      viewCount++;
      
      res.cookie(req.params.id, viewCount);
    }
    const visitorId = generateRandomString()
    const addVisit = new newVisit(Date(), visitorId);

    urlParsed[req.params.id].visits[visitorId] = addVisit;

      // stringify new object and write to file
    const newData = JSON.stringify(urlParsed, null, 4);
    fs.writeFile('./data/urlDatabase.json', newData, err => {
      if (err) throw err;

    // print confirm
      console.log(`Updated ./data/urlDatabase.json`);
    });


    res.redirect(longURL);
    return;
  } else {
    res.send("Invalid Short URL");
  }
})

// GET request for Register
app.get('/register', (req, res) => {
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id]
  }

  // if cookie is not null redirect to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }

  res.render('register', templateVars);
});

// GET request for Login
app.get('/login', (req, res) => {
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
  }
  // if cookie is not null redirect to /urls
  if (req.session.user_id) {
    res.redirect('/urls');
    return;
  }

  res.render('login', templateVars);
});

app.get('/recovery', (req, res) => {
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
  }
  res.render('recovery', templateVars)
})

app.get('/newpassword', (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("You are not logged in.");
  }

  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
    newPassword: req.cookies["newPassword"]
  }

  res.render('newpassword', templateVars);
})

app.get('/newemail', (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("You are not logged in.");
  }

  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
  }

  res.render('newemail', templateVars);
})

// GET request for user dashboard
app.get('/dashboard', (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("You are not logged in.");
  }
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
  }
  res.render('dashboard', templateVars);
})

app.get('/deleteaccount', (req, res) => {
  if (!req.session.user_id) {
    res.status(400).send("You are not logged in.");
  }
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.session.user_id],
  }
  res.render('deleteaccount', templateVars);
})

//--- GET END ---//

//--- POST START ---//

// POST request when adding URL
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.send("You are unable to shorten URLs. You must log in.\n");
    return;
  }
  req.body.id = generateRandomString();
  const {id, longURL} = req.body;

  // read json file and parse
  const urlList = fs.readFileSync(urlsDatabase);
  const urlParsed = JSON.parse(urlList);

  // add id + longURL to object
  const addURL = new newURL(longURL, req.session.user_id, {});
  urlParsed[id] = addURL;

  // stringify new object and write to file
  const newData = JSON.stringify(urlParsed, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`{ ${id}: ${longURL} for user ${req.session.user_id} } added to ./data/urlDatabase.json`);
  });

  // redirect to /urls/:id
  res.redirect(`/urls/${id}`);
  return;
});

// POST request for User Login
app.post('/login', (req, res) => {
  // return user by email
  const user = getUserByEmail(req.body.email, usersDatabase)

  if (!req.body.email && !req.body.password) {
    res.status(400).send("No email or password provided.");
    return;
  }
  // check if user exists
  if (!user){
    res.status(403).send("No email provided.");
    return;
  }

  // check if passwords match
  if (!bcrypt.compareSync(req.body.password, user.password)) {
    res.status(403).send("Wrong password.");
    return;
  }

  // set user_id cookie to user.id
  req.session.user_id = user.id;
  res.redirect('/urls');
  return;
});

// POST request to clearCookie and User Logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
  return;
});

// POST request to register new user
app.post('/register', (req, res) => {
  // generate random ID
  const newID = generateRandomString();

  // read users.json and parse
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  // if no email or password provided return 400
  if (req.body.email.length === 0 || !req.body.password) {
    console.log("no user")
    res.status(400).send("No email or password provided");
    return;
  }

  // if email exists in the database, return 400
  if (getUserByEmail(req.body.email, usersDatabase)) {
    console.log("email found")
    res.status(400).send("Email already exists.");
    return;
  } else {
    // new User using constructor (password is hashed using bcrypt)
    const newUser = new User(newID, req.body.email, bcrypt.hashSync(req.body.password, 10), req.body.secQuestion, bcrypt.hashSync(req.body.secAnswer, 10));
  
    // add new user with newID as key to userParsed
    userParsed[newID] = newUser;
  
    // stringify new object and write to file
    const newData = JSON.stringify(userParsed, null, 4);
    fs.writeFile('./data/users.json', newData, err => {
      if (err) throw err;
  
      // print confirm
      console.log(`Updated ./data/users.json`);
    });
  
    // set cookie to newID
    req.session.user_id = newID;

    res.redirect('/urls');
    return;
  }
});

// POST request to access password recovery
app.post('/recovery', (req, res) => {
  const user = getUserByEmail(req.body.email, usersDatabase);

  if (!user) {
    res.status(400).send("Account not found.");
    return;
  }

  if (user.secQuestion !== req.body.secQuestion) {
    res.status(400).send("Security Question does not match.");
    return;
  }

  if (!bcrypt.compareSync(req.body.secAnswer, user.secAnswer)) {
    res.status(400).send("Wrong security answer provided.");
    return;
  }

  req.session.user_id = user.id;
  res.redirect('/newpassword');
});

//--- POST END ---//

// DELETE request to delete URL from list
app.delete('/urls/:id', (req, res) => {
  // read json file and parse
  const urlList = fs.readFileSync(urlsDatabase);
  const urlParsed = JSON.parse(urlList);

  // check for permission
  if (!req.session.user_id) {
    res.send('You must log in.')
    return;
  }
  if (urlParsed[req.params.id].userID !== req.session.user_id) {
    res.send("Access Denied.");
    return;
  }

  delete urlParsed[req.params.id];

  // stringify new object and write to file
  const newData = JSON.stringify(urlParsed, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/urlDatabase.json`);
  });

  res.clearCookie(req.params.id);
  res.redirect('/urls');
  return;
});

// DELETE request to delete account
app.delete('/deleteaccount', (req, res) => {
  if (!req.session.user_id) {
    res.send('You must log in.')
    return;
  }

  // read json file and parse
  const urlList = fs.readFileSync(urlsDatabase);
  const urlParsed = JSON.parse(urlList);
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  // DELETE URLS from urlDatabase.json
  for (const url in urlParsed) {
    if (urlParsed[url].userID === userParsed[req.session.user_id].id) {
      delete urlParsed[url];
    }
  }

  // stringify new object and write to file
  const urlData = JSON.stringify(urlParsed, null, 4);
  fs.writeFile('./data/urlDatabase.json', urlData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/urlDatabase.json`);
  });

  // DELETE USER from users.json

  delete userParsed[req.session.user_id];

  // stringify new object and write to file
  const userData = JSON.stringify(userParsed, null, 4);
  fs.writeFile('./data/users.json', userData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/users.json`);
  });
    
  req.session = null;
  res.redirect('/urls');
  return;
})

// PUT request to edit longURL
app.put('/urls/:id', (req, res) => {
    // read json file and parse
    const urlList = fs.readFileSync(urlsDatabase);
    const urlParsed = JSON.parse(urlList);

  // check for permission
  if (!req.session.user_id) {
    res.status(403).send('You must log in.')
    return;
  }
  if (urlParsed[req.params.id].userID !== req.session.user_id) {
    res.status(400).send("Access Denied.");
    return;
  }

  urlParsed[req.params.id].longURL = req.body.longURL;

  // stringify new object and write to file
  const newData = JSON.stringify(urlParsed, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/urlDatabase.json`);
  });

  res.redirect('/urls');
  return;
});

// PUT request to edit account password
app.put('/newpassword', (req, res) => {
  // check for permission
  if (!req.session.user_id) {
    res.status(403).send("You are not logged in.");
  }

  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  userParsed[req.session.user_id].password = bcrypt.hashSync(req.body.password, 10);

  const newData = JSON.stringify(userParsed, null, 4);

  fs.writeFile('./data/users.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/users.json`);
  });

  res.redirect('/urls');
  return;
})

// PUT request to edit account email
app.put('/newemail', (req, res) => {  
  const userList = fs.readFileSync(usersDatabase);
  const userParsed = JSON.parse(userList);

  if (!req.session.user_id) {
    res.status(403).send("You are not logged in.");
  }

    // check if passwords match
    if (!bcrypt.compareSync(req.body.password, userParsed[req.session.user_id].password)) {
      res.status(403).send("Wrong password.");
      return;
    }

  userParsed[req.session.user_id].email = req.body.email;

  const newData = JSON.stringify(userParsed, null, 4);

  fs.writeFile('./data/users.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/users.json`);
  });

  res.redirect('/urls');
  return;
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});