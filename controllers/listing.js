const Listing = require("../models/listing");
const User = require("../models/user");
const axios = require("axios");

// INDEX
module.exports.index = async (req, res) => {
    const { q, category } = req.query;

    let query = {};

    if (q && q.trim() !== "") {
        query.$or = [
            { title: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } }
        ];
    }

    if (category) {
        query.category = category;
    }

    const allListings = await Listing.find(query);

    let wishlist = [];
    if (req.user) {
        const user = await User.findById(req.user._id);
        wishlist = user.wishlist.map(id => id.toString());
    }

    res.render("listings/index.ejs", {
        allListings,
        q,
        category,
        wishlist
    });
};

// NEW FORM
module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

// SHOW
module.exports.showListing = async (req, res) => {
    let { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: { path: "author" }
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
};

//create listing
module.exports.createListing = async (req, res, next) => {
    try {
        const { location } = req.body.listing;

        //ONLY use location 
        const searchText = location;

        console.log("SEARCH TEXT:", searchText);

        const geoResponse = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: searchText,
                    format: "json",
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    "User-Agent": "staysphere-app (your-real-email@gmail.com)"
                },
                timeout: 5000
            }
        );

        const data = geoResponse.data;

        if (!data || data.length === 0) {
            req.flash("error", "Please select a valid location from suggestions");
            return res.redirect("/listings/new");
        }

        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);

        const newListing = new Listing(req.body.listing);

        if (req.file) {
            newListing.image = {
                url: req.file.path,
                filename: req.file.filename
            };
        }

        newListing.owner = req.user._id;

        newListing.geometry = {
            type: "Point",
            coordinates: [lng, lat]
        };

        await newListing.save();

        req.flash("success", "New Listing Created!");
        res.redirect(`/listings/${newListing._id}`);

    } catch (err) {
        next(err);
    }
};

// EDIT FORM
module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

// UPDATE LISTING
module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    let listing = await Listing.findById(id);

    const oldLocation = listing.location;

    Object.assign(listing, req.body.listing);

    if (oldLocation !== listing.location) {

        const searchText = listing.location;

        const geoResponse = await axios.get(
            "https://nominatim.openstreetmap.org/search",
            {
                params: {
                    q: searchText,
                    format: "json",
                    limit: 1
                },
                headers: {
                    "User-Agent": "staysphere-app (your-real-email@gmail.com)"
                },
                timeout: 5000
            }
        );

        if (geoResponse.data.length === 0) {
            req.flash("error", "Location update failed. Please select from suggestions.");
            return res.redirect(`/listings/${id}/edit`);
        }

        const lat = parseFloat(geoResponse.data[0].lat);
        const lng = parseFloat(geoResponse.data[0].lon);

        listing.geometry = {
            type: "Point",
            coordinates: [lng, lat]
        };
    }

    if (typeof req.file !== "undefined") {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    }

    await listing.save();

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

// DELETE
module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};