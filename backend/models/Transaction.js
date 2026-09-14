import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['EXPENSE', 'INCOME'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Other Payment',
      trim: true,
    },
    source: {
      type: String,
      default: 'Manual',
    },
    account: {
      type: String,
      default: null,
    },
    rawSms: {
      type: String,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
