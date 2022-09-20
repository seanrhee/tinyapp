const express = require('express');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const users = './data/users.json';


const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: [")J@NcRfUjWnZr4u7"]
}));


const generateRandomString = function() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// constructor function for new User
function User(id, email, password) {
  this.id = id;
  this.email = email;
  this.password = password;
};

// constructor function for new URL
function newURL(longURL, userID) {
  this.longURL = longURL;
  this.userID = userID;
};

// return user by email
function getUserByEmail(email, database) {
  const userList = fs.readFileSync(database);
  const userParsed = JSON.parse(userList);

  for (const user in userParsed) {
    if (userParsed[user].email === email) {
      return userParsed[user];
    }
  }
  return null;
}

// return object of matching userID urls
function urlsForUser(id) {
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const urlParsed = JSON.parse(urlList);

  let userURLs = {};

  for (const url in urlParsed) {
    if (urlParsed[url].userID === id) {
      userURLs[url] = urlParsed[url];
    }
  }

  return userURLs;
}

app.use(express.urlencoded({ extended: true }));

// GET START

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html\n');
});

// GET request for URL index
app.get('/urls', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  // return all URLs matching userID to cookie id
  const userURL = urlsForUser(req.session.user_id);

  const templateVars = {
    urls: userURL,
    user: userParsed[req.session.user_id]
  };

  res.render('urls_index', templateVars);
});

// GET request for New URL
app.get('/urls/new', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
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
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const urlParsed = JSON.parse(urlList);
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);
  
  const templateVars = {
    id: req.params.id,
    longURL: urlParsed[req.params.id].longURL,
    user: userParsed[req.session.user_id]
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
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const urlParsed = JSON.parse(urlList);

  const longURL = urlParsed[req.params.id].longURL;
  if (longURL) {
    res.redirect(longURL);
    return;
  } else {
    res.send("Invalid Short URL");
  }
})

// GET request for Register
app.get('/register', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
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
  const userList = fs.readFileSync('./data/users.json');
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

// GET ENDnewID

// POST request when adding URL
app.post('/urls', (req, res) => {
  if (!req.session.user_id) {
    res.send("You are unable to shorten URLs. You must log in.\n");
    return;
  }
  req.body.id = generateRandomString();
  const {id, longURL} = req.body;

  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const urlParsed = JSON.parse(urlList);

  // add id + longURL to object
  const addURL = new newURL(longURL, req.session.user_id)
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

// POST request to delete URL from list
app.post('/urls/:id/delete', (req, res) => {
  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
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

  res.redirect('/urls');
  return;
});

// POST request to edit longURL
app.post('/urls/:id/edit', (req, res) => {
  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
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

// POST request for User Login
app.post('/login', (req, res) => {
  // return user by email
  const user = getUserByEmail(req.body.email, users)

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
  // res.cookie("user_id", user.id);
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
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  // if no email or password provided return 400
  if (req.body.email.length === 0 || !req.body.password) {
    console.log("no user")
    res.status(400).send("No email or password provided");
    return;
  }

  // if email exists in the database, return 400
  if (getUserByEmail(req.body.email, users)) {
    console.log("email found")
    res.status(400).send("Email already exists.");
    return;
  } else {

    // new User using constructor (password is hashed using bcrypt)
    const newUser = new User(newID, req.body.email, bcrypt.hashSync(req.body.password, 10));
  
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
    // res.cookie("user_id", newID);

    res.redirect('/urls');
    return;
  }

})

// POST END

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});