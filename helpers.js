const fs = require('fs');

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
function urlsForUser(id, database) {
  const urlList = fs.readFileSync(database);
  const urlParsed = JSON.parse(urlList);

  let userURLs = {};

  for (const url in urlParsed) {
    if (urlParsed[url].userID === id) {
      userURLs[url] = urlParsed[url];
    }
  }

  return userURLs;
}

// generates random string for IDs
const generateRandomString = function() {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}


module.exports = { getUserByEmail, urlsForUser, generateRandomString };