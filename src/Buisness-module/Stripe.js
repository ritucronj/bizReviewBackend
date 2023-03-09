const express = require("express");
const router = express.Router();
const key = process.env.STRIPE_SECRET_KEY;

const stripe = require("stripe")(key);
require("dotenv").config();

router.post("/create-checkout-session", async (req, res) => {
  const { name, price } = req.body;
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
    success_url: `${process.env.SERVER_ADDR1}/success`,
    cancel_url: `${process.env.SERVER_ADDR1}/cancel`,
  });

  res.json({ data: session });
  //   res.redirect(session.url);
});

module.exports = router;
