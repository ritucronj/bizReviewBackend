var paypal = require("paypal-rest-sdk");
const express = require("express");
const router = express.Router();

require("dotenv").config();
paypal.configure({
  mode: "sandbox", // sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});
var uid;
var date = new Date();
var planPurchaseDate;
var planPrice;
var plan;

router.post("/subscribe1/:plan", function (req, res) {
  console.log(req);
  plan = req.params.plan;
  uid = req.body.id;
  date = new Date();
  planPurchaseDate = date;
  planPrice = req.body.price;
  var payment = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:8080/successpaypal",
      cancel_url: "http://localhost:8080/cancel",
    },
    transactions: [
      {
        amount: {
          total: planPrice,
          currency: "INR",
        },
        description: plan,
      },
    ],
  };

  paypal.payment.create(payment, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      for (var i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          // Redirect the user to the PayPal approval URL
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

router.get("/successpaypal", function (req, res) {
  var paymentId = req.query.paymentId;
  var payerId = req.query.PayerID;

  var execute_payment = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          total: "10.00",
          currency: "USD",
        },
      },
    ],
  };

  paypal.payment.execute(paymentId, execute_payment, function (error, payment) {
    if (error) {
      console.log(error);
    } else {
      console.log(payment.id); // Payment ID
      res.send("Payment success");
    }
  });
});
module.exports = router;
