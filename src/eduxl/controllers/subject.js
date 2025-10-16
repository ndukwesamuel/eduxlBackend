import asyncWrapper from "../../middlewares/asyncWrapper.js";
import subjectModel from "../models/subjectModel.js";
import { governmentQuestions } from "../questionsSeeding/utme/goverment/goverment2024.js";

export const createSubject = async (req, res) => {
  try {
    const { subject, type } = req.body;

    const existing = await subjectModel.findOne({ subject, type });
    if (existing) {
      return res.status(400).json({ message: "Subject already exists" });
    }
    const newSubject = await subjectModel.create({ subject, type });
    res
      .status(201)
      .json({ message: "Subject created successfully", data: newSubject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addQuestion = async (req, res) => {
  try {
    // const { subject, type, year, questions } = req.body;

    const subject = "government";
    const type = "utme";
    const year = "3024"; // You can later pass this dynamically via req.body or query
    const questions = governmentQuestions;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Questions array is required" });
    }

    const existing = await subjectModel.findOne({ subject, type });

    if (existing) {
      // Check if that year already exists
      const yearSet = existing.questionSets.find((set) => set.year === year);
      if (yearSet) {
        return res.status(400).json({
          message: `❌ Questions for ${subject} (${type}, ${year}) already exist`,
        });
      }

      // Add new year group
      existing.questionSets.push({
        year,
        questions,
      });

      await existing.save();
      return res.status(200).json({
        message: `✅ Added questions for ${subject} (${type}, ${year})`,
        data: existing,
      });
    } else {
      // Subject does not exist — create new subject with questions
      const created = await subjectModel.create({
        subject,
        type,
        questionSets: [
          {
            year,
            questions,
          },
        ],
      });

      return res.status(201).json({
        message: `✅ Created new subject and added questions for ${year}`,
        data: created,
      });
    }
  } catch (err) {
    console.error("❌ Error adding questions:", err);
    res.status(500).json({ message: err.message });
  }
};

export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await subjectModel.find().select("subject type");
    res.status(200).json({ total: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubjectQuestions = async (req, res) => {
  try {
    const { subject, type } = req.body;

    const result = await subjectModel.findOne({ subject, type });
    if (!result) return res.status(404).json({ message: "Subject not found" });

    res.status(200).json({ total: result.questions.length, data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
