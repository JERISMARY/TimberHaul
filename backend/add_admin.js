require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const addAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected.');

    const email = 'jerismary@gmail.com';
    const password = 'Jeris@123';

    let user = await User.findOne({ email });
    if (user) {
      console.log('User found, updating to admin...');
      user.role = 'admin';
      user.password = password; // pre-save hook will hash it
      if (!user.firstName) user.firstName = 'Jeris';
      if (!user.lastName) user.lastName = 'Mary';
      await user.save();
      console.log('User updated to admin successfully.');
    } else {
      console.log('Creating new admin user...');
      user = await User.create({
        firstName: 'Jeris',
        lastName: 'Mary',
        name: 'Jeris Mary',
        email,
        password,
        role: 'admin'
      });
      console.log('New admin user created successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

addAdmin();
