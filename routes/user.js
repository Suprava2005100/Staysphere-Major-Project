const express = require("express");
const router = express.Router();
const User = require("../models/user.js"); 
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");  // ✅ add isLoggedIn

const userController = require("../controllers/users.js");

// SIGNUP
router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

// LOGIN
router
.route("/login")
.get(userController.renderLoginForm)
.post(
    saveRedirectUrl, 
    passport.authenticate("local", { 
        failureRedirect: '/login', 
        failureFlash: true
    }), 
    userController.login
);

// LOGOUT
router.get("/logout", userController.logout);


//WISHLIST TOGGLE ROUTE 
router.post("/wishlist/:id", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id);
    const listingId = req.params.id;

    const exists = user.wishlist.some(
        (id) => id.toString() === listingId
    );

    if (exists) {
        user.wishlist.pull(listingId);
    } else {
        user.wishlist.push(listingId);
    }

    await user.save();

    res.json({ success: true });
});

//Wishlist page
router.get("/wishlist", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    res.render("listings/wishlist.ejs", { listings: user.wishlist });
});
module.exports = router;