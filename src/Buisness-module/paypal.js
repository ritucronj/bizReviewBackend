const express = require("express");
const router = express.Router();
const paypal = require("paypal-rest-sdk");
require("dotenv").config();
const serverAddr = process.env.SERVER_ADDR;

paypal.configure({
  mode: "sandbox",
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});
router.get("/subscribe/:plan", function (req, res) {
  var plan = req.params.plan;
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
      cancel_url: `${serverAddr}/cancel`,
      return_url: `${serverAddr}/success`,
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
                function (error, billingAgreement) {
                  if (error) {
                    throw error;
                  } else {
                    for (var i = 0; i < billingAgreement.links.length; i++) {
                      if (billingAgreement.links[i].rel === "approval_url") {
                        res.redirect(billingAgreement.links[i].href);
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

router.get("/success", function (req, res) {
  var token = req.query.token;
  // Execute the billing agreement
  paypal.billingAgreement.execute(
    token,
    {},
    function (error, billingAgreement) {
      if (error) {
        throw error;
      } else {
        res.send("Success");
      }
    }
  );
});

router.get("/cancel", function (req, res) {
  res.send("Cancelled");
});

module.exports = router;
