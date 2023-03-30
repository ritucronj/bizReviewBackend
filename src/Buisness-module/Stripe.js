const express = require("express");
const router = express.Router();
const secretkey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(secretkey);
const Business = require("./models/business.model");
const { contactUserEmail } = require("../utils/SendMail");

require("dotenv").config();
let name;
let price;
let uid;
let session;

router.post("/create-checkout-session", async (req, res) => {
  // console.log("payment api", req.body);
  uid = req.body.id;
  name = req.body.name;
  price = req.body.price;
  session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
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
    success_url: `http://206.81.14.11:${process.env.PORT}/success1`,
    cancel_url: `http://206.81.14.11:${process.env.PORT}/cancel1`,
  });

  res.json({ data: session });
});

router.get("/success1", async (req, res) => {
  // console.log("webhook");
  // const result = stripe.redirectToCheckout({
  //   sessionId: session.id,
  // });
  // console.log("result", result);
  const event = req.body;
  console.log(event);
  const date = new Date();
  // stripe.charges.create(
  //   {
  //     amount: `${price}00`, // Amount in cents
  //     currency: "usd", // Currency in ISO format
  //     source: "tok_visa", // Token representing the credit card to charge
  //   },
  //   async function (err, charge) {
  //     // console.log(err, charge);
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       console.log("Payment successful! Payment ID: " + charge.id);
  //     }
  //   }
  // );

  try {
    const business = await Business.findByIdAndUpdate(
      uid,
      {
        planType: name,
        planPurchaseDate: date,
        isPlanExpired: false,
        planPrice: price,
        // paymentId: charge.id,
      },
      { new: true }
    );

    if (business && business.planPurchaseDate && business.planPrice) {
      contactUserEmail(
        business.companyName,
        business.email,
        `Your Payment of $${business.planPrice} was sucessful for the plan ${business.planType}`
      );
    }
    res.redirect(`${process.env.SERVER_ADDR}/success`);
  } catch (err) {
    console.log(err);
  }
});
router.get("/cancel1", function (req, res) {
  // res.send("Cancelled");
  res.redirect(`${process.env.SERVER_ADDR}/cancel`);
});

module.exports = router;
