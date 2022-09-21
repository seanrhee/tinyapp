const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const users = './data/users.json'

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", users)
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID)
  });
});