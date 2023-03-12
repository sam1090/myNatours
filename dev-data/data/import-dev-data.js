const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const fs = require('fs');
const path = require('path');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

mongoose.set('strictQuery', true);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log('DataBase is connected'));
const tourpath = path.join(`${__dirname}`, '/tours.json');
const userpath = path.join(`${__dirname}`, '/users.json');
const reviewpath = path.join(`${__dirname}`, '/reviews.json');

const tours = JSON.parse(fs.readFileSync(tourpath, 'utf-8'));
const users = JSON.parse(fs.readFileSync(userpath, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(reviewpath, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('the data is imported');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteTour = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('the data is deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteTour();
}
