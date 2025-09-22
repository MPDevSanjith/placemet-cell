import mongoose from 'mongoose';

const eligibilitySettingsSchema = new mongoose.Schema({
  attendanceMin: { type: Number, default: 80 },
  backlogMax: { type: Number, default: 0 },
  cgpaMin: { type: Number, default: 6.0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure singleton document using a fixed _id
eligibilitySettingsSchema.statics.getSingleton = async function() {
  try {
    const fixedId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'); // Valid 24-char ObjectId
    let doc = await this.findById(fixedId);
    if (!doc) {
      doc = new this({ _id: fixedId });
      await doc.save();
    }
    return doc;
  } catch (error) {
    // If the fixed ID approach fails, try to find any existing document or create a new one
    let doc = await this.findOne();
    if (!doc) {
      doc = new this();
      await doc.save();
    }
    return doc;
  }
};

const EligibilitySettings = mongoose.model('EligibilitySettings', eligibilitySettingsSchema);

export default EligibilitySettings;


