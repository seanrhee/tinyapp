const express = require('express')
const urlDatabase = require('./data/urlDatabase.json')
const fs = require('fs');


const app = express();
const PORT = 8080;

app.set("view engine", "ejs");


const generateRandomString = function() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

app.use(express.urlencoded({ extended: true }));

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

app.post('/urls', (req, res) => {
  req.body.id = generateRandomString();
  const {id, longURL} = req.body;

  const urlList = fs.readFileSync('./data/urlDatabase.json');
  const parsedList = JSON.parse(urlList);

  parsedList[id] = longURL;

  const newData = JSON.stringify(parsedList, null, 4);
  fs.writeFile('./data/urlDatabase.json', newData, err => {
    if (err) throw err;

    console.log(`{ ${id}: ${longURL} } added to ./data/urlDatabase.json`);
  });

  res.redirect(`/urls/${id}`);
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


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});