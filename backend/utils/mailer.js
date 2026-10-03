const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. This OTP will expire in 10 minutes.`,
    html: `
      <div>
        <h2>Password Reset</h2>
        <p>Your password reset OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
      `,
  });
};

const sendDeliveryOtpEmail = async (email, otp, receiverName, trackingId) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Delivery Verification OTP - ${trackingId}`,
    text: `Dear ${receiverName},

Your shipment ${trackingId} is ready for delivery.

Your delivery verification OTP is ${otp}.

Please provide this OTP to the authorized delivery driver at the time of delivery.

This OTP will expire in 10 minutes.

If you did not expect this delivery, please contact our support team.

Regards,
Logistics Management Team`,

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Delivery Verification</h2>

        <p>Dear ${receiverName},</p>

        <p>
          Your shipment <strong>${trackingId}</strong> is ready for delivery.
        </p>

        <p>Your delivery verification OTP is:</p>

        <h1 style="letter-spacing: 5px;">${otp}</h1>

        <p>
          Please provide this OTP to the authorized delivery driver
          at the time of delivery.
        </p>

        <p>
          <strong>This OTP will expire in 10 minutes.</strong>
        </p>

        <p>
          If you did not expect this delivery, please contact our support team.
        </p>

        <p>
          Regards,<br />
          <strong>Logistics Management Team</strong>
        </p>
      </div>
    `,
  });
};

const sendDrivertoReminder = async (
  email,
  driverName,
  licenseNumber,
  expiryDate,
  drvId,
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Reminder: Driving License Expiring Soon - ${driverName}`,

    text: `Dear ${driverName} (${drvId}),

This is a reminder that your driving license is due to expire soon.

Driving License Number: ${licenseNumber}
Expiry Date: ${expiryDate}

Please renew your driving license before the expiry date to avoid any interruption to your driving duties.

Once the license has been renewed, please share a copy of the renewed license with the concerned team for record updates.

Please treat this as a priority.

Regards,
Logistics Management Team`,

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Driving License Expiry Reminder</h2>

      <p>Dear ${driverName} (${drvId}),</p>

      <p>
        This is a reminder that your driving license is
        <strong>due to expire soon</strong>.
      </p>

      <p>
        <strong>Driving License Number:</strong> ${licenseNumber}<br />
        <strong>Expiry Date:</strong> ${expiryDate}
      </p>

      <p>
        Please renew your driving license before the expiry date
        to avoid any interruption to your driving duties.
      </p>

      <p>
        Once your license has been renewed, please share a copy of
        the renewed license with the concerned team for record updates.
      </p>

      <p>
        <strong>Please treat this as a priority.</strong>
      </p>

      <p>
        Regards,<br />
        <strong>Logistics Management Team</strong>
      </p>
    </div>
  `,
  });
};

const sendShipmentStatusUpdate = async (
  email,
  customerName,
  shipmentNumber,
  shipmentStatus,
  estimatedDeliveryDate,
  trackingNumber,
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Shipment Status Update - ${shipmentNumber}`,

    text: `Dear ${customerName},

We would like to provide you with an update regarding your shipment.

Shipment Number: ${shipmentNumber}
Tracking Number: ${trackingNumber}
Current Status: ${shipmentStatus}
Estimated Delivery Date: ${estimatedDeliveryDate}

Your shipment is currently ${shipmentStatus.toLowerCase()}.

We will continue to monitor the shipment and keep you updated on any further changes in its status.

If you have any questions regarding your shipment, please feel free to contact our support team.

Regards,
Logistics Management Team`,

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Shipment Status Update</h2>

      <p>Dear ${customerName},</p>

      <p>
        We would like to provide you with an update regarding your shipment.
      </p>

      <p>
        <strong>Shipment Number:</strong> ${shipmentNumber}<br />
        <strong>Tracking Number:</strong> ${trackingNumber}<br />
        <strong>Current Status:</strong> ${shipmentStatus}<br />
        <strong>Estimated Delivery Date:</strong> ${estimatedDeliveryDate}
      </p>

      <p>
        Your shipment is currently
        <strong>${shipmentStatus.toLowerCase()}</strong>.
      </p>

      <p>
        We will continue to monitor the shipment and keep you updated
        on any further changes in its status.
      </p>

      <p>
        If you have any questions regarding your shipment, please feel
        free to contact our support team.
      </p>

      <p>
        Regards,<br />
        <strong>Logistics Management Team</strong>
      </p>
    </div>
  `,
  });
};

const sendShipmentAssignedEmail = async (
  email,
  driverName,
  shipmentNumber,
  pickupLocation,
  deliveryLocation,
  vehicleName,
  vehicleNumber,
  stops,
) => {
  // Format stops for plain-text email
  const stopsText = stops?.length
    ? stops
        .map(
          (stop, index) =>
            `${index + 1}. ${stop.location} - ${stop.stopType || "Stop"}`,
        )
        .join("\n")
    : "No additional stops";

  // Format stops for HTML email
  const stopsHtml = stops?.length
    ? stops
        .map(
          (stop, index) => `
            <li>
              <strong>Stop ${index + 1}:</strong>
              ${stop.location}
              ${stop.stopType ? `(${stop.stopType})` : ""}
            </li>
          `,
        )
        .join("")
    : "<li>No additional stops</li>";

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Shipment Assigned`,

    text: `Dear ${driverName},

A new shipment has been assigned to you.

Shipment Number: ${shipmentNumber}
Vehicle Name: ${vehicleName}
Vehicle Number: ${vehicleNumber}
Pickup Location: ${pickupLocation}
Delivery Location: ${deliveryLocation}

Shipment Stops:
${stopsText}

Please review the shipment details and ensure that you are available for the assigned pickup.

Kindly follow the listed stops in the given order and report to each location as required.

Please follow all required shipment and safety procedures during the journey.

If you have any questions or require clarification regarding the shipment or stops, please contact the Logistics Management Team.

Regards,
Logistics Management Team`,

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Shipment Assignment</h2>

      <p>Dear ${driverName},</p>

      <p>
        A new shipment has been <strong>assigned to you</strong>.
      </p>

      <p>
        <strong>Shipment Number:</strong> ${shipmentNumber}<br />
        <strong>Vehicle Name:</strong> ${vehicleName}<br />
        <strong>Vehicle Number:</strong> ${vehicleNumber}<br />
        <strong>Pickup Location:</strong> ${pickupLocation}<br />
        <strong>Delivery Location:</strong> ${deliveryLocation}
      </p>

      <h3>Shipment Stops</h3>

      <p>
        Please follow the stops in the order listed below:
      </p>

      <ol>
        ${stopsHtml}
      </ol>

      <p>
        Please review the shipment details and ensure that you are
        available for the assigned pickup.
      </p>

      <p>
        Kindly report to the pickup location on time and follow all
        required shipment and safety procedures during the journey.
      </p>

      <p>
        If you have any questions or require clarification regarding
        the shipment or stops, please contact the Logistics Management Team.
      </p>

      <p>
        Regards,<br />
        <strong>Logistics Management Team</strong>
      </p>
    </div>
  `,
  });
};

const sendAccountCreatedEmail = async (email, name, password, role) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Account Created Successfully`,

    text: `Dear ${name},

Your account has been created successfully.

Account Details:

Name: ${name}
Email: ${email}
Password: ${password}
Role: ${role}

You can now use these credentials to log in to the system.

For security reasons, please keep your password confidential and do not share it with anyone.

If you have any questions or face any issues while accessing your account, please contact the Administration Team.

Regards,
Administration Team`,

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Account Created Successfully</h2>

      <p>Dear ${name},</p>

      <p>
        Your account has been <strong>created successfully</strong>.
      </p>

      <h3>Account Details</h3>

      <p>
        <strong>Name:</strong> ${name}<br />
        <strong>Email:</strong> ${email}<br />
        <strong>Password:</strong> ${password}<br />
        <strong>Role:</strong> ${role}
      </p>

      <p>
        You can now use these credentials to log in to the system.
      </p>

      <p>
        For security reasons, please keep your password confidential
        and do not share it with anyone.
      </p>

      <p>
        If you have any questions or face any issues while accessing
        your account, please contact the Administration Team.
      </p>

      <p>
        Regards,<br />
        <strong>Administration Team</strong>
      </p>
    </div>
  `,
  });
};

module.exports = {
  sendOtpEmail,
  sendDeliveryOtpEmail,
  sendDrivertoReminder,
  sendShipmentStatusUpdate,
  sendShipmentAssignedEmail,
  sendAccountCreatedEmail,
};
