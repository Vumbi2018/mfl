require('dotenv').config();
const NotificationService = require('./services/notification.service');

async function testNotification() {
    console.log("🧪 Testing Notification Service...");

    // Simulate Status Change
    await NotificationService.notifyFacilityStatusChange(
        "General Hospital Test",
        "123",
        "Closed",
        "Operational",
        "lawrencemukombo2@gmail.com"
    );

    console.log("\n✅ Test Complete. Check console logs for 'SMTP credentials missing' message (expected behavior locally).");
}

testNotification();
