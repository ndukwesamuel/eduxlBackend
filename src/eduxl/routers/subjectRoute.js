import express from "express";
import {
  addQuestion,
  createSubject,
  getAllSubjects,
  getSubjectQuestions,
} from "../controllers/subject.js";
import subjectModel from "../models/subjectModel.js";

const router = express.Router();

router.post("/create", createSubject);
router.post("/addQuestion", addQuestion);
router.post("/getAllSubjects", getAllSubjects);
router.post("/getSubjectQuestions", getSubjectQuestions);

router.delete("/clear", async (req, res) => {
  try {
    const result = await subjectModel.deleteMany({});
    res.status(200).json({
      success: true,
      message: "All subjects cleared successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing subjects:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while clearing the database",
      error: error.message,
    });
  }
});

export default router;
