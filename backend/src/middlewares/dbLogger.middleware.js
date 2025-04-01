import DbLogs from "../models/dbLogs.model.js"; // Path to your DbLogs model

// Middleware to handle insert, update, and delete
function dbLogger(modelName) {
  return async function (next) {
    try {
      // Get the operation type (insert, update, delete)
      const operation = this.isNew ? 'insert' : (this.isModified() ? 'update' : 'delete');

      // Ensure we capture the necessary details in context (this comes from Express request)
      const { ipAddress, origin, user } = this._reqContext || {}; // Assuming you attach context to this

      if (operation === 'insert') {
        const log = new DbLogs({
          transactionType: "insert",
          transactionDetails: `Inserted a new document into ${modelName}`,
          status: "success",
          affectedCollection: modelName,
          affectedDocumentId: this._id, // Document ID that was inserted
          newValue: this,
          user: user,
          ipAddress: ipAddress,
          origin: origin,
        });
        await log.save();
        next();
      }

      // Log update
      if (operation === 'update') {
        const changes = this._doc; // Get document's current state
        const previous = this._previousData || this._doc; // Store previous data manually during update
        const log = new DbLogs({
          transactionType: "update",
          transactionDetails: `Updated a document in ${modelName}`,
          status: "success",
          affectedCollection: modelName,
          affectedDocumentId: this._id, // Document ID that was updated
          previousValue: previous,
          newValue: changes,
          user: user,
          ipAddress: ipAddress,
          origin: origin,
        });
        await log.save();
        next();
      }

      // Log delete
      if (operation === 'delete') {
        const log = new DbLogs({
          transactionType: "delete",
          transactionDetails: `Deleted a document from ${modelName}`,
          status: "success",
          affectedCollection: modelName,
          affectedDocumentId: this._id, // Document ID that was deleted
          previousValue: this,
          user: user,
          ipAddress: ipAddress,
          origin: origin,
        });
        await log.save();
        next();
      }
    } catch (error) {
      console.log("Error logging transaction:", error);
      next(error); // Pass the error to the next middleware
    }
  };
}

export default dbLogger;
