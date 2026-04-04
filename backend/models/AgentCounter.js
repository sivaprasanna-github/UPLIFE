import mongoose from 'mongoose';

/**
 * AgentCounter
 * One document per stateCode, holds the last-issued sequence number.
 * Using findOneAndUpdate with $inc + upsert guarantees atomic increment
 * even under concurrent requests.
 */
const agentCounterSchema = new mongoose.Schema({
  stateCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

/**
 * Atomically increment and return the next sequence number for a given state.
 * @param {string} stateCode  e.g. "TS"
 * @returns {Promise<number>} next sequence integer (starts at 1)
 */
agentCounterSchema.statics.nextSeq = async function (stateCode) {
  const doc = await this.findOneAndUpdate(
    { stateCode: stateCode.toUpperCase() },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

const AgentCounter = mongoose.model('AgentCounter', agentCounterSchema);
export default AgentCounter;