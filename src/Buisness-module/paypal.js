const express = require("express");
const router = express.Router();
const paypal = require("paypal-rest-sdk");
require("dotenv").config();
const Business = require("./models/business.model");
const serverAddr = process.env.SERVER_ADDR1;
const Port = process.env.PORT;
const SERVER_ADDR1 = process.env.SERVER_ADDR1;

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

router.post("/subscribe/:plan", function (req, res) {
  plan = req.params.plan;
  uid = req.body.id;
  date = new Date();
  planPurchaseDate = date;
  planPrice = req.body.price;
  var billingPlanId;

  if (
    plan !== "silver" &&
    plan !== "gold" &&
    plan !== "diamond" &&
    plan !== "platinum"
  ) {
    res.send("Invalid plan");
    return;
  }

  var billingPlanAttributes = {
    name: plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan",
    description:
      plan.charAt(0).toUpperCase() + plan.slice(1) + " Plan Subscription",
    type: "INFINITE",
    payment_definitions: [
      {
        name: "Regular Payment",
        type: "REGULAR",
        frequency: "MONTH",
        frequency_interval: "1",
        amount: {
          value: "0",
          currency: "USD",
        },
        cycles: "0",
      },
    ],
    merchant_preferences: {
      cancel_url: `http://localhost:${Port}/cancel`,
      return_url: `http://localhost:${Port}/success`,
      auto_bill_amount: "YES",
      initial_fail_amount_action: "CONTINUE",
      max_fail_attempts: "0",
    },
  };

  // Set the subscription amount based on the selected plan
  switch (plan) {
    case "silver":
      billingPlanAttributes.payment_definitions[0].amount.value = "79.00";
      break;
    case "gold":
      billingPlanAttributes.payment_definitions[0].amount.value = "149.00";
      break;
    case "diamond":
      billingPlanAttributes.payment_definitions[0].amount.value = "999.00";
      break;
    case "platinum":
      billingPlanAttributes.payment_definitions[0].amount.value = "399.00";
      break;
  }
  // Create the billing plan
  paypal.billingPlan.create(
    billingPlanAttributes,
    function (error, billingPlan) {
      if (error) {
        throw error;
      } else {
        billingPlanId = billingPlan.id;

        // Activate the billing plan
        paypal.billingPlan.update(
          billingPlanId,
          [
            {
              op: "replace",
              path: "/",
              value: {
                state: "ACTIVE",
              },
            },
          ],
          function (error, response) {
            if (error) {
              throw error;
            } else {
              // Create the billing agreement
              var billingAgreementAttributes = {
                name:
                  plan.charAt(0).toUpperCase() +
                  plan.slice(1) +
                  " Subscription",
                description:
                  plan.charAt(0).toUpperCase() +
                  plan.slice(1) +
                  " Subscription",
                start_date:
                  new Date(new Date().getTime() + 300000)
                    .toISOString()
                    .slice(0, 19) + "Z",
                plan: {
                  id: billingPlanId,
                },
                payer: {
                  payment_method: "paypal",
                },
              };

              paypal.billingAgreement.create(
                billingAgreementAttributes,
                async function (error, billingAgreement) {
                  if (error) {
                    throw error;
                  } else {
                    for (var i = 0; i < billingAgreement.links.length; i++) {
                      if (billingAgreement.links[i].rel === "approval_url") {
                        res.redirect(billingAgreement.links[i].href);
                        // const business = await Business.findByIdAndUpdate(
                        //   uid,
                        //   {
                        //     planType: plan,
                        //     planPurchaseDate: planPurchaseDate,
                        //     isPlanExpired: false,
                        //     planPrice: planPrice,
                        //   },
                        //   { new: true }
                        // );
                      }
                    }
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

router.get("/success", async function (req, res) {
  console.log("req in paypal", req);
  const business = await Business.findByIdAndUpdate(
    uid,
    {
      planType: plan,
      planPurchaseDate: planPurchaseDate,
      isPlanExpired: false,
      planPrice: planPrice,
    },
    { new: true }
  );
  console.log("outside", business);
  var token = req.query.token;
  // Execute the billing agreement
  paypal.billingAgreement.execute(
    token,
    {},
    async function (error, billingAgreement) {
      if (error) {
        throw error;
      } else {
        const business = await Business.findByIdAndUpdate(
          uid,
          {
            planType: plan,
            planPurchaseDate: planPurchaseDate,
            isPlanExpired: false,
            planPrice: planPrice,
          },
          { new: true }
        );
        console.log("success", business);
        res.redirect(`${SERVER_ADDR1}/success`);
      }
    }
  );
});

router.get("/cancel", function (req, res) {
  // res.send("Cancelled");
  res.redirect(`${SERVER_ADDR1}/cancel`);
});

module.exports = router;
