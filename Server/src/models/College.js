import mongoose from 'mongoose'

const collegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  logoUrl: {
    type: String,
    trim: true
  },
  logoPublicId: {
    type: String,
    trim: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Ensure only one college document exists (singleton pattern)
collegeSchema.statics.getSingleton = async function(updatedBy) {
  let college = await this.findOne()
  if (!college) {
    college = new this({ 
      name: 'Your College Name',
      updatedBy: updatedBy
    })
    await college.save()
  }
  return college
}

const College = mongoose.model('College', collegeSchema)

export default College
