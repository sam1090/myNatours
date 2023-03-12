const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, ' user must have a name'],
  },
  email: {
    type: String,
    required: [true, ' usesr must have a email'],
    unique: [true, 'user must hv unique value'],
    lowercase: true,
    validate: [validator.isEmail, 'please provide correct email'],
  },

  photo: String,

  role: {
    type: String,
    enum: [`user`, 'guide', 'lead-guide', `admin`], //fix the default enum role error
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'user must enter password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'enter confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: ' the password is not matched',
    },
  },
  passwordChangedAt: Date,

  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //this will run only if the password is modified
  if (!this.isModified('password')) return next();

  //this will encrypt the password
  this.password = await bcrypt.hash(this.password, 12);

  //to delete confirm password from database
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
