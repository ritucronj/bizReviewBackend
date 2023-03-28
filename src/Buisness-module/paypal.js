const express = require("express");
const router = express.Router();
const paypal = require("paypal-rest-sdk");
// const paypalId = require("@paypal/checkout-server-sdk");
require("dotenv").config();
const Business = require("./models/business.model");
const { contactUserEmail } = require("../utils/SendMail");
const serverAddr = process.env.SERVER_ADDR;
const Port = process.env.PORT;
const SERVER_ADDR = process.env.SERVER_ADDR;

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});
var uid;
var date = new Date();
var planPurchaseDate;
var planPrice;
var plan;

// new paypal payment
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
  console.log("subscribe", req.body);
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
      return_url: `http://206.81.14.11:${Port}/successpaypal`,
      cancel_url: `http://206.81.14.11:${Port}/cancel`,
    },
    transactions: [
      {
        amount: {
          total: planPrice,
          currency: "USD",
        },
        description: plan,
      },
    ],
  };

  paypal.payment.create(payment, function (error, payment) {
    if (error) {
      // console.log(error);
    } else {
      for (var i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel === "approval_url") {
          // Redirect the user to the PayPal approval URL
          // console.log(payment.links[i].href);
          res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

router.get("/successpaypal", async function (req, res) {
  // console.log(req);
  var paymentId = req.query.paymentId;
  var payerId = req.query.PayerID;
  // var planpay = planPrice.toString;
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

  paypal.payment.execute(
    paymentId,
    execute_payment,
    async function (error, payment) {
      if (error) {
        // console.log(error);
      } else {
        console.log("uid", uid); // Payment ID
        try {
          const business = await Business.findByIdAndUpdate(
            uid,
            {
              planType: plan,
              planPurchaseDate: planPurchaseDate,
              isPlanExpired: false,
              planPrice: planPrice,
              paymentId: payment.id,
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
          // res.send("Payment success");
          res.redirect(`${SERVER_ADDR}/success`);
        } catch (err) {
          console.log(err);
        }
      }
    }
  );
});

router.get("/cancel", function (req, res) {
  // res.send("Cancelled");
  res.redirect(`${SERVER_ADDR}/cancel`);
});

module.exports = router;
