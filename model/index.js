'use strict';

require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const user = require('./user');
const Collection = require('./collection');


// const DATABASE_URL = process.env.NODE_ENV === 'test' ? 'sqlite::memory' : process.env.DATABASE_URL;

const DATABASE_URL = process.env.NODE_ENV === 'test' ? 'sqlite:memory' : process.env.DATABASE_URL;

const sequelizeDB = new Sequelize(DATABASE_URL);

const userModel = user(sequelizeDB, DataTypes);


module.exports = {
  sequelizeDB,
  userCollection: new Collection(userModel),
  
};
