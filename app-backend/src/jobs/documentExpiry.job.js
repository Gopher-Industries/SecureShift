import cron from "node-cron";
import User from "../models/User.js";
import { calculateExpiryStatus } from "../services/document.service.js";

cron.schedule("0 0 * * *", async () => {
    const users = await User.find();

    for (const user of users) {
        user.documents.forEach(doc => {
            doc.expiryStatus = calculateExpiryStatus(doc.expiryDate);
        });

        await user.save();
    }

    console.log("Document expiry statuses updated");
});