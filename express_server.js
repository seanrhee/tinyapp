const express = require('express');
const cookieParser = require('cookie-parser');

const fs = require('fs');


const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(cookieParser());


const generateRandomString = function() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

function User(id, email, password) {
  this.id = id;
  this.email = email;
  this.password = password;
};

function checkUser(userList, email) {
  for (const u in userList) {
    console.log(userList[u].email)
    if (userList[u].email === email) {
      return false;
    }
  }
  return true;
};

function getUserByEmail(email) {
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  for (const user in userParsed) {
    if (userParsed[user].email === email) {
      return userParsed[user];
    }
  }
  return null;
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
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  const templateVars = {
    urls: parsedList,
    user: userParsed[req.cookies["user_id"]]
  };

  res.render('urls_index', templateVars);
});

// GET request for New URL
app.get('/urls/new', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);
  const templateVars = {
    user: userParsed[req.cookies["user_id"]]
  }
  res.render('urls_new', templateVars);
});

// GET request for ID/edit page
app.get('/urls/:id', (req, res) => {
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);
  
  const templateVars = {
    id: req.params.id,
    longURL: parsedList[req.params.id],
    user: userParsed[req.cookies["user_id"]]
  }
  
  res.render("urls_show", templateVars)
});

// GET request for redirect to longURL
app.get('/u/:id', (req, res) => {
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  const longURL = parsedList[req.params.id];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("Invalid Short URL");
  }
})

// GET request for Register
app.get('/register', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.cookies["user_id"]]
  }
  res.render('register', templateVars);
});

// GET request for Login
app.get('/login', (req, res) => {
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  const templateVars = {
    user: userParsed[req.cookies["user_id"]]
  }
  res.render('login', templateVars);
});

// GET END

// POST START

// POST request when adding URL
app.post('/urls', (req, res) => {
  req.body.id = generateRandomString();
  const {id, longURL} = req.body;

  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  // add id + longURL to object
  parsedList[id] = longURL;

  // stringify new object and write to file
  const newData = JSON.stringify(parsedList, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`{ ${id}: ${longURL} } added to ./data/urlDatabase.json`);
  });

  // redirect to /urls/:id
  res.redirect(`/urls/${id}`);
});

// POST request to delete URL from list
app.post('/urls/:id/delete', (req, res) => {
  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  delete parsedList[req.params.id];

  // stringify new object and write to file
  const newData = JSON.stringify(parsedList, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/urlDatabase.json`);
  });

  res.redirect('/urls');
});

// POST request to edit longURL
app.post('/urls/:id/edit', (req, res) => {
  // read json file and parse
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  parsedList[req.params.id] = req.body.longURL;

  // stringify new object and write to file
  const newData = JSON.stringify(parsedList, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    // print confirm
    console.log(`Updated ./data/urlDatabase.json`);
  });

  res.redirect('/urls');
});

// POST request for User Login
app.post('/login', (req, res) => {
  res.cookie("user_id", req.body.username);
  res.redirect('/urls');
});

// POST request to clearCookie and User Logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// POST request to register new user
app.post('/register', (req, res) => {
  const newID = generateRandomString();
  const userList = fs.readFileSync('./data/users.json');
  const userParsed = JSON.parse(userList);

  if (!req.body.email || !req.body.password) {
    res.sendStatus(400);
  }

  if (getUserByEmail(req.body.email)) {
    res.sendStatus(400);
  } else {

    const newUser = new User(newID, req.body.email, req.body.password);
    res.cookie("user_id", newID);
  
    
  
    userParsed[newID] = newUser;
  
    // stringify new object and write to file
    const newData = JSON.stringify(userParsed, null, 4);
    fs.writeFile('./data/users.json', newData, err => {
      if (err) throw err;
  
      // print confirm
      console.log(`Updated ./data/users.json`);
    });
  
    res.redirect('/urls');  
  }

})

// POST END

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// This is my new branch!