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
  const fixedId = 'eligibility-settings-singleton-id-0001';
  let doc = await this.findById(fixedId);
  if (!doc) {
    doc = new this({ _id: fixedId });
    await doc.save();
  }
  return doc;
};

const EligibilitySettings = mongoose.model('EligibilitySettings', eligibilitySettingsSchema);

export default EligibilitySettings;


