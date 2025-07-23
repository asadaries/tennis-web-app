import { Express } from "express";
import crypto from "crypto";
import qs from "querystring";
import { storage } from "./storage.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const PAYSERA_PROJECT_ID = process.env.PAYSERA_PROJECT_ID || "";
const PAYSERA_PASSWORD = process.env.PAYSERA_PASSWORD || "";

function generatePayseraData(params: Record<string, string | number>): string {
  const encoded = qs.stringify(params);
  return Buffer.from(encoded).toString("base64");
}

function generatePayseraSignature(data: string): string {
  return crypto.createHash("md5").update(data + PAYSERA_PASSWORD).digest("hex");
}

function validateCallback(data: string, sign: string): boolean {
  const expectedSign = crypto.createHash("md5").update(data + PAYSERA_PASSWORD).digest("hex");
  return expectedSign === sign;
}

function decodeCallbackData(data: string): Record<string, string> {
  const decoded = Buffer.from(data, "base64").toString("utf-8");
  return qs.parse(decoded) as Record<string, string>;
}

export function setupPaysera(app: Express) {
  app.get("/api/payment/success", (req, res) => {
    try {
      console.log("Payment success redirect received");
      res.status(200).json({ 
        message: "Payment was successful!",
        status: "success"
      });
    } catch (error) {
      console.error("Payment success handling error:", error);
      res.status(500).json({ message: "Error processing payment success" });
    }
  });

  app.get("/api/payment/cancel", (req, res) => {
    try {
      console.log("Payment cancel redirect received");
      res.status(200).json({ 
        message: "Payment was canceled.",
        status: "canceled"
      });
    } catch (error) {
      console.error("Payment cancel handling error:", error);
      res.status(500).json({ message: "Error processing payment cancellation" });
    }
  });

  app.post("/api/payment/callback", (req, res) => {
    try {
      const { data, ss1 } = req.body;
      
      if (!data || !ss1) {
        console.warn("Missing Paysera callback data");
        return res.status(400).json({ message: "Missing Paysera data" });
      }

      const valid = validateCallback(data, ss1);
      if (!valid) {
        console.warn("Invalid Paysera callback signature");
        return res.status(403).json({ message: "Invalid signature" });
      }

      const callbackData = decodeCallbackData(data);
      console.log("🔁 Paysera callback received:", callbackData);


      res.status(200).send("OK");
    } catch (error) {
      console.error("Payment callback error:", error);
      res.status(500).json({ message: "Callback processing failed" });
    }
  });

  app.post("/api/payment/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const {
        orderid,
        amount,
        currency = "EUR",
        accepturl = `${process.env.BASE_URL || "http://localhost:3000"}/api/payment/success`,
        cancelurl = `${process.env.BASE_URL || "http://localhost:3000"}/api/payment/cancel`,
        callbackurl = `${process.env.BASE_URL || "http://localhost:3000"}/api/payment/callback`,
        lang = "ENG",
        payment,
        country,
        test = process.env.NODE_ENV === "production" ? 0 : 1,
        ...rest
      } = req.body;

      if (!orderid || !amount) {
        return res.status(400).json({ 
          message: "Order ID and amount are required" 
        });
      }

      const params: Record<string, string | number> = {
        projectid: PAYSERA_PROJECT_ID,
        orderid,
        amount,
        currency,
        accepturl,
        cancelurl,
        callbackurl,
        lang,
        test,
        ...rest,
      };

      if (payment) params.payment = payment;
      if (country) params.country = country;

      const data = generatePayseraData(params);
      const sign = generatePayseraSignature(data);

      console.log(`Payment generation request for user ${req.user?.id}, order: ${orderid}`);

      res.status(200).json({ 
        data, 
        sign,
        paymentUrl: "https://www.paysera.com/pay/",
        message: "Payment data generated successfully"
      });
    } catch (error) {
      console.error("Payment generation error:", error);
      res.status(500).json({ message: "Payment generation failed" });
    }
  });

  app.get("/api/payment/status/:orderid", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { orderid } = req.params;
      
      if (!orderid) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      console.log(`Payment status check for order: ${orderid} by user: ${req.user?.id}`);
      
      res.status(200).json({ 
        orderid,
        status: "pending",
        message: "Payment status retrieved successfully"
      });
    } catch (error) {
      console.error("Payment status check error:", error);
      res.status(500).json({ message: "Failed to retrieve payment status" });
    }
  });

  app.post("/api/payment/create-order", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amount, currency = "EUR", description } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      const orderid = `ORDER_${Date.now()}_${req.user?.id}`;
      
      console.log(`Payment order created: ${orderid} for user: ${req.user?.id}`);

      res.status(201).json({
        orderid,
        amount,
        currency,
        description,
        userId: req.user?.id,
        message: "Payment order created successfully"
      });
    } catch (error) {
      console.error("Payment order creation error:", error);
      res.status(500).json({ message: "Failed to create payment order" });
    }
  })
};