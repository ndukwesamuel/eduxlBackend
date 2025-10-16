import { Poll } from "../models/poll.js";

const createPoll = async (req, res) => {
  try {
    //   only clan admin can create this poll
    const { question, options } = req.body;
    const clanId = req.clan.id;
    if (!question || !options || options.length === 0) {
      return res
        .status(400)
        .json({ message: "Question or options cannot be empty" });
    }
    const newPoll = new Poll({
      clanId: clanId,
      question: question,
      options: options.map((option) => ({ text: option, votes: 0 })),
    });
    await newPoll.save();
    res
      .status(201)
      .json({ data: "Poll created successfully", question, options });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const vote = async (req, res) => {
  const pollId = req.params.id;
  const voterId = req.user._id;
  try {
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found", data: [] });
    }

    const { optionIndex } = req.body;
    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= poll.options.length
    ) {
      return res
        .status(400)
        .json({ message: "Invalid option index: Enter a valid number" });
    }

    const hasVoted = poll.votes.some(
      (vote) => vote.voterId.toString() === voterId.toString()
    );
    if (hasVoted) {
      return res
        .status(400)
        .json({ message: "You have already voted in this poll" });
    }
    const optionText = poll.options[optionIndex].text;
    poll.options[optionIndex].votes++;
    poll.markModified("options"); // added this line bcoz it wasn't detecting the votes increament

    poll.votes.push({ optionText, voterId });
    await poll.save();

    res.status(200).json({ data: "Voting completed" });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};

const getAllPoll = async (req, res) => {
  try {
    const poll = await Poll.find()
      .populate({ path: "clanId", select: "name" })
      .populate({ path: "votes.voterId", select: "name" })
      .sort({ createdAt: -1 });

    if (poll.length === 0) {
      return res
        .status(200)
        .json({ message: "No poll has been created yet!", data: [] });
    }

    res.status(200).json({ data: poll });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};

const usergetAllPoll = async (req, res) => {
  const clanuser = req.clan;
  console.log({
    bbb: clanuser._id,
    bbb3: clanuser,
  });

  try {
    const poll = await Poll.find({ clanId: clanuser._id }) // Added filter for clanId
      .populate({ path: "clanId", select: "name" })
      .populate({ path: "votes.voterId", select: "name" })
      .sort({ createdAt: -1 });

    if (poll.length === 0) {
      return res
        .status(200)
        .json({ message: "No poll has been created yet!", data: [] });
    }

    res.status(200).json({ data: poll });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};

const getPollById = async (req, res) => {
  const { id } = req.params;
  try {
    const poll = await Poll.findOne({ _id: id })
      .populate({ path: "clanId", select: "name" })
      .populate({ path: "votes.voterId", select: "name" });

    if (!poll) {
      return res.status(404).json({ message: "Poll not found", data: [] });
    }

    res.status(200).json({ data: poll });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};

const editPoll = async (req, res) => {
  const { id } = req.params;
  const { question, options } = req.body;
  try {
    if (!question && (!options || options.length === 0)) {
      return res.status(400).json({
        message:
          "At least one of the following must be provided: question, options",
      });
    }
    const data = {};
    if (question) {
      data.question = question;
    }
    if (options && options.length > 0) {
      data.options = options.map((option) => ({ text: option }));
    }

    const poll = await Poll.findByIdAndUpdate({ _id: id }, data, { new: true });
    if (!poll) {
      return res.status(404).json({ message: "Poll not found", data: [] });
    }
    res.status(200).json({ message: "Poll edited", data: poll });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};
const deletePoll = async (req, res) => {
  const { id } = req.params;
  try {
    const poll = await Poll.findByIdAndDelete({ _id: id });
    if (!poll) {
      return res.status(404).json({ message: "Poll not found", data: [] });
    }
    res.status(200).json({ message: "Poll deleted", data: poll });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message, message: "Internal server error" });
  }
};
export {
  createPoll,
  vote,
  getAllPoll,
  getPollById,
  editPoll,
  deletePoll,
  usergetAllPoll,
};
