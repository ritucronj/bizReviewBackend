const express = require("express");
const router = express.Router();
const secretkey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(secretkey);
const Business = require("./models/business.model");

require("dotenv").config();
let name;
let price;
let uid;

router.post("/create-checkout-session", async (req, res) => {
  console.log("payment api", req.body);
  uid = req.body.id;
  name = req.body.name;
  price = req.body.price;
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "INR",
          product_data: {
            name: name,
            images: ["https://i.imgur.com/EHyR2nP.png"],
          },
          unit_amount: `${price}00`,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `http://localhost:${process.env.PORT}/success1`,
    cancel_url: `http://localhost:${process.env.PORT}/cancel1`,
  });

  res.json({ data: session });
});

router.get("/success1", async (req, res) => {
  console.log("webhook");
  const event = req.body;
  console.log(event);
  const date = new Date();
  stripe.charges.create(
    {
      amount: price, // Amount in cents
      currency: "inr", // Currency in ISO format
      source: "tok_visa", // Token representing the credit card to charge
    },
    function (err, charge) {
      if (err) {
        console.error(err);
      } else {
        console.log("Payment successful! Payment ID: " + charge.id);
      }
    }
  );
  const business = await Business.findByIdAndUpdate(
    uid,
    {
      planType: name,
      planPurchaseDate: date,
      isPlanExpired: false,
      planPrice: price,
    },
    { new: true }
  );
  res.redirect(`${process.env.SERVER_ADDR1}/success`);
});
router.get("/cancel1", function (req, res) {
  // res.send("Cancelled");
  res.redirect(`${process.env.SERVER_ADDR1}/cancel`);
});

module.exports = router;
