const pdfParse = require("pdf-parse");
const { generateInterviewReport, generateResumePdf } = require("../services/ai.services");
const interviewReportModel = require("../models/interviewReport.model");
const mammoth = require("mammoth");

async function generateInterviewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body;

    if (!req.file && !selfDescription) {
      return res.status(400).json({
        message: "Please upload a PDF resume or provide a self description",
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        message: "Job description is required",
      });
    }

    let resumeText = null;

    if (req.file) {
      console.log("File:", req.file.originalname);
      console.log("Type:", req.file.mimetype);

      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Please upload a PDF or DOCX resume",
        });
      }

      if (req.file.mimetype === "application/pdf") {
        const resumeData = await pdfParse(req.file.buffer);
        resumeText = resumeData.text;
      } else {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = result.value;
      }
    }

    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });

    console.log("AI Response:", interviewReportByAi);

    // ✅ Parse technicalQuestions if AI returned strings
    const parsedTechnicalQuestions = (interviewReportByAi.technicalQuestions || []).map(q => {
      if (typeof q === "string") {
        const questionMatch = q.match(/Question:\s*(.*?)(?=Intention:|$)/si);
        const intentionMatch = q.match(/Intention:\s*(.*?)(?=How to answer:|Answer:|$)/si);
        const answerMatch = q.match(/(?:How to answer|Answer):\s*(.*?)$/si);
        return {
          question: questionMatch?.[1]?.trim() || q,
          intention: intentionMatch?.[1]?.trim() || "To assess candidate knowledge",
          answer: answerMatch?.[1]?.trim() || "Provide a detailed answer"
        };
      }
      return q;
    });

    // ✅ Parse behavioralQuestions if AI returned strings
    const parsedBehavioralQuestions = (interviewReportByAi.behavioralQuestions || []).map(q => {
      if (typeof q === "string") {
        const questionMatch = q.match(/Question:\s*(.*?)(?=Intention:|$)/si);
        const intentionMatch = q.match(/Intention:\s*(.*?)(?=STAR|How to answer:|Answer:|$)/si);
        const answerMatch = q.match(/(?:STAR Method Guide|How to answer|Answer):\s*(.*?)$/si);
        return {
          question: questionMatch?.[1]?.trim() || q,
          intention: intentionMatch?.[1]?.trim() || "To assess candidate behavior",
          answer: answerMatch?.[1]?.trim() || "Use the STAR method to answer"
        };
      }
      return q;
    });

    // ✅ Parse skillGaps if AI returned strings like "TypeScript: High"
    const parsedSkillGaps = (interviewReportByAi.skillGaps || []).map(gap => {
      if (typeof gap === "string") {
        const parts = gap.split(":");
        const skill = parts[0]?.trim() || gap;
        const severityRaw = parts[1]?.trim().toLowerCase() || "medium";
        const severity = ["low", "medium", "high"].includes(severityRaw) ? severityRaw : "medium";
        return { skill, severity };
      }
      return gap;
    });

    // ✅ Parse preparationPlan if AI returned strings
    const parsedPreparationPlan = (interviewReportByAi.preparationPlan || []).map((plan, index) => {
      if (typeof plan === "string") {
        const dayMatch = plan.match(/Day\s*(\d+)/i);
        const focusMatch = plan.match(/Day\s*\d+[:\s]+(.*?)(?=\.|Tasks:|Daily Tasks:|$)/si);
        return {
          day: dayMatch ? parseInt(dayMatch[1]) : index + 1,
          focus: focusMatch?.[1]?.trim() || `Day ${index + 1}`,
          tasks: plan.split(/\.\s+/).filter(t => t.trim().length > 10).slice(1, 4)
        };
      }
      return plan;
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription,
      jobDescription,
      title: interviewReportByAi.job_title || interviewReportByAi.title || "Interview Report",
      matchScore: interviewReportByAi.matchScore || 0,
      overallRecommendation: interviewReportByAi.overallRecommendation || "",
      strengths: interviewReportByAi.strengths || [],
      areasForDevelopment: interviewReportByAi.areasForDevelopment || [],
      interviewNotes: Array.isArray(interviewReportByAi.interviewNotes)
        ? interviewReportByAi.interviewNotes.join("\n")
        : interviewReportByAi.interviewNotes || "",
      technicalQuestions: parsedTechnicalQuestions,
      behavioralQuestions: parsedBehavioralQuestions,
      skillGaps: parsedSkillGaps,
      preparationPlan: parsedPreparationPlan,
      aiResponse: interviewReportByAi,
    });

    res.status(201).json({
      message: "Interview report generated successfully",
      interviewReport,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function getInterviewReportByIdController(req, res) {
  try {
    const { interviewId } = req.params;
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan");

    res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function generateResumePdfController(req, res) {
  try {
    const { interviewReportId } = req.params;
    const interviewReport = await interviewReportModel.findById(interviewReportId);

    if (!interviewReport) {
      return res.status(404).json({ message: "Interview report not found." });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    // ✅ Make sure we have enough data to generate resume
    if (!resume && !selfDescription) {
      return res.status(400).json({ 
        message: "No resume or self description found to generate PDF." 
      });
    }

    const pdfBuffer = await generateResumePdf({ 
      resume: resume || "Not provided", 
      jobDescription: jobDescription || "Not provided", 
      selfDescription: selfDescription || "Not provided"
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  generateInterviewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};