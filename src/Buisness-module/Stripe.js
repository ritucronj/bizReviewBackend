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
    success_url: `${process.env.SERVER_ADDR}/success`,
    cancel_url: `${process.env.SERVER_ADDR}/cancel`,
  });

  res.json({ data: session });
});

router.post("/webhook", async (req, res) => {
  const event = req.body;

  if (event.type === "checkout.session.completed") {
    const session = event.data;
    const date = new Date();

    const payload = {
      planType: name,
      planPurchaseDate: date,
      isPlanExpired: false,
    };

    const updateData = await Business.findOneAndUpdate(
      { uId: uid },
      { $set: payload },
      {
        new: true,
      }
    );

    res.json(session);
  } else {
    res.json({ received: false });
  }
});

module.exports = router;
