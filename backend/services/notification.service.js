const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendEmail = async (to, subject, html) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`⚠️ SMTP credentials missing. Email not sent to ${to}.`);
        console.log(`📩 Subject: ${subject}`);
        console.log(`📝 Content: ${html}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"MFL System" <no-reply@mfl.gov.pg>',
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

exports.notifyFacilityStatusChange = async (facilityName, facilityId, oldStatus, newStatus, recipients) => {
    const subject = `Facility Status Update: ${facilityName}`;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${baseUrl}/facilities/${facilityId}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">Facility Status Change</h2>
            <p>The status of facility <strong>${facilityName}</strong> has been updated.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Old Status:</strong> ${oldStatus || 'N/A'}</p>
                <p style="margin: 5px 0;"><strong>New Status:</strong> <span style="color: #27ae60; font-weight: bold;">${newStatus}</span></p>
            </div>
            <a href="${link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Facility Record</a>
            <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">Please log in to the system to view more details.</p>
        </div>
    `;
    await this.sendEmail(recipients, subject, html);
};

exports.notifyFacilityCreated = async (facilityName, facilityId, createdBy, recipients) => {
    const subject = `New Facility Created: ${facilityName}`;
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const link = `${baseUrl}/facilities/${facilityId}`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">New Facility Pending Review</h2>
            <p>A new facility <strong>${facilityName}</strong> has been created by <strong>${createdBy}</strong>.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p>This facility is currently in <strong>Pending Review</strong> status.</p>
            </div>
            <a href="${link}" style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Facility</a>
            <p style="margin-top: 20px; font-size: 12px; color: #7f8c8d;">Please log in to the system to approve or reject this facility.</p>
        </div>
    `;
    await this.sendEmail(recipients, subject, html);
};
