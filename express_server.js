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

app.use(express.urlencoded({ extended: true }));

// GET START

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html\n');
});

app.get('/urls', (req, res) => {
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  const templateVars = {urls: parsedList};

  res.render('urls_index', templateVars);
});

app.get('/urls/new', (req, res) => {
  res.render('urls_new');
});

app.get('/urls/:id', (req, res) => {
  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);
  
  const templateVars = { id: req.params.id, longURL: parsedList[req.params.id]}
  
  res.render("urls_show", templateVars)
});

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

app.post('/login', (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect('/urls');
  
});

// POST END

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});

// This is my new branch!