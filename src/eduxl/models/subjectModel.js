// // import mongoose from "mongoose";

// // // --- Question Subschema ---
// // const QuestionSchema = new mongoose.Schema({
// //   question: {
// //     type: String,
// //     required: true,
// //   },
// //   option: {
// //     a: { type: String, required: true },
// //     b: { type: String, required: true },
// //     c: { type: String, required: true },
// //     d: { type: String, required: true },
// //   },
// //   answer: {
// //     type: String,
// //     required: true,
// //     enum: ["a", "b", "c", "d"],
// //   },
// //   solution: {
// //     type: String,
// //   },
// //   image: {
// //     type: String,
// //   },
// //   examtype: {
// //     type: String,
// //     required: true,
// //   },
// //   examyear: {
// //     type: String,
// //     required: true,
// //   },
// // });

// // // --- Subject Schema ---
// // const SubjectSchema = new mongoose.Schema(
// //   {
// //     subject: {
// //       type: String,
// //       required: true,
// //       trim: true,
// //     },
// //     type: {
// //       type: String,
// //       required: true,
// //       enum: ["utme", "waec", "neco", "jamb", "practice", "other"],
// //       default: "utme",
// //     },
// //     questions: [QuestionSchema],
// //   },
// //   { timestamps: true }
// // );

// // // Ensure subject + type combination is unique
// // SubjectSchema.index({ subject: 1, type: 1 }, { unique: true });

// // export default mongoose.model("Subject", SubjectSchema);

// import mongoose from "mongoose";

// // --- Question Subschema ---
// const QuestionSchema = new mongoose.Schema({
//   question: { type: String, required: true },
//   option: {
//     a: { type: String, required: true },
//     b: { type: String, required: true },
//     c: { type: String, required: true },
//     d: { type: String, required: true },
//   },
//   answer: { type: String, required: true, enum: ["a", "b", "c", "d"] },
//   solution: String,
//   image: String,
//   examtype: String,
//   examyear: String,
// });

// // --- Yearly Question Group Schema ---
// const YearlyQuestionSchema = new mongoose.Schema({
//   year: { type: String, required: true },
//   questions: [QuestionSchema],
// });

// // --- Subject Schema ---
// const SubjectSchema = new mongoose.Schema(
//   {
//     subject: { type: String, required: true, trim: true },
//     type: {
//       type: String,
//       required: true,
//       enum: ["utme", "waec", "neco", "jamb", "practice", "other"],
//       default: "utme",
//     },
//     questionSets: [YearlyQuestionSchema], // 👈🏽 Grouped by year
//   },
//   { timestamps: true }
// );

// // Ensure unique subject + type combo
// SubjectSchema.index({ subject: 1, type: 1 }, { unique: true });

// export default mongoose.model("Subject", SubjectSchema);

import mongoose from "mongoose";

// --- Question Subschema ---
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  option: {
    a: { type: String, required: true },
    b: { type: String, required: true },
    c: { type: String, required: true },
    d: { type: String, required: true },
  },
  answer: { type: String, required: true, enum: ["a", "b", "c", "d"] },
  solution: String,
  image: String,
  examtype: String,
  examyear: String,
});

// --- Yearly Question Group Schema ---
const YearlyQuestionSchema = new mongoose.Schema({
  year: { type: String, required: true },
  questions: { type: [QuestionSchema], default: [] },
});

// --- Subject Schema ---
const SubjectSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["utme", "waec", "neco", "jamb", "practice", "other"],
      default: "utme",
    },
    questionSets: { type: [YearlyQuestionSchema], default: [] },
  },
  { timestamps: true }
);

// Ensure subject + type combo is unique
SubjectSchema.index({ subject: 1, type: 1 }, { unique: true });

export default mongoose.model("Subject", SubjectSchema);
