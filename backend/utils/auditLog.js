const { AuditLog, User } = require("../db/db");
const mongoose = require("mongoose");

const getModelName = (resource = "") => {
  const r = String(resource).trim().toLowerCase();
  if (r === "shipment" || r === "shipments") return "shipments";
  if (r === "driver") return "driver";
  if (r === "vehicle" || r === "vechile") return "vechile";
  if (r === "warehouse") return "warehouse";
  if (r === "trip") return "trip";
  if (r === "delivery") return "delivery";
  if (r === "pod") return "pod";
  if (r === "invoice") return "invoice";
  if (r === "user") return "user";
  if (r === "customer") return "customer";
  return null;
};

const createAuditLog = async ({ userId, action, resource, resourceId }) => {
  try {
    let validUserId = userId;
    if (!validUserId || !mongoose.Types.ObjectId.isValid(validUserId)) {
      const fallbackUser = await User.findOne();
      validUserId = fallbackUser ? fallbackUser._id : null;
    }

    if (!validUserId) {
      console.warn("Audit log skipped: No valid userId available.");
      return;
    }

    const modelName = getModelName(resource);
    const isValidObjectId =
      resourceId && mongoose.Types.ObjectId.isValid(String(resourceId));

    const logPayload = {
      userId: validUserId,
      action,
      resource,
      resourceId: isValidObjectId ? resourceId : null,
      resourceModel: isValidObjectId ? modelName : undefined,
    };

    await AuditLog.create(logPayload);
  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};

module.exports = createAuditLog;
