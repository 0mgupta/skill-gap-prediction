const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

// ✅ Retry helper for 503 / 429 errors
const withRetry = async (fn, retries = 5, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn()
        } catch (error) {
            const message = error?.message || JSON.stringify(error)
            const is503 = message.includes("503") || message.includes("UNAVAILABLE") || message.includes("high demand")
            const is429 = message.includes("429") || message.includes("RESOURCE_EXHAUSTED")

            const waitTime = is429 ? 20000 : is503 ? delay : 0

            if ((is503 || is429) && i < retries - 1) {
                console.log(`Gemini overloaded. Retrying in ${waitTime / 1000}s... (attempt ${i + 2}/${retries})`)
                await new Promise(res => setTimeout(res, waitTime))
            } else {
                throw error
            }
        }
    }
}

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate matches the job"),
    technicalQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    behavioralQuestions: z.array(z.object({
        question: z.string(),
        intention: z.string(),
        answer: z.string()
    })),
    skillGaps: z.array(z.object({
        skill: z.string(),
        severity: z.enum(["low", "medium", "high"])
    })),
    preparationPlan: z.array(z.object({
        day: z.number(),
        focus: z.string(),
        tasks: z.array(z.string())
    })),
    title: z.string(),
    strengths: z.array(z.string()),
    areasForDevelopment: z.array(z.string()),
    overallRecommendation: z.string(),
    interviewNotes: z.string(),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `You are an expert interview coach. Analyze the candidate profile against the job description and generate a detailed interview preparation report.

Candidate Resume: ${resume || "Not provided"}
Candidate Self Description: ${selfDescription || "Not provided"}  
Job Description: ${jobDescription}

Generate a JSON report with:
- matchScore: realistic 0-100 score based on candidate fit
- title: job title from the description
- strengths: at least 3 candidate strengths relevant to the job
- areasForDevelopment: at least 3 areas to improve
- overallRecommendation: detailed recommendation
- interviewNotes: preparation tips
- technicalQuestions: at least 5 technical interview questions with intention and how to answer
- behavioralQuestions: at least 3 behavioral questions with intention and STAR method answer guide
- skillGaps: all skills missing from the job description with severity (low/medium/high)
- preparationPlan: 7-day preparation plan with focus and daily tasks`

    const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    }))

    return JSON.parse(response.text)
}

// ✅ Fixed Puppeteer with Windows support
async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    // ✅ Fallback values so prompt never has "undefined" or "null"
    const resumeContent = resume || selfDescription || "MERN Stack Developer with experience in React.js, Node.js, Express.js, MongoDB"
    const selfDesc = selfDescription || "Experienced MERN Stack Developer skilled in building full-stack web applications"
    const jobDesc = jobDescription || "Full Stack MERN Developer"

    console.log("Generating resume PDF with:")
    console.log("Resume:", resumeContent.slice(0, 100))
    console.log("Self Description:", selfDesc.slice(0, 100))
    console.log("Job Description:", jobDesc.slice(0, 100))

    const resumePdfSchema = z.object({
        html: z.string().describe("Complete HTML content of the resume with inline CSS styling")
    })

    const prompt = `You are a professional resume writer. Generate a complete, well-formatted HTML resume.

Candidate Resume/Experience: ${resumeContent}
Candidate Self Description: ${selfDesc}
Target Job Description: ${jobDesc}

Generate an HTML resume that is:
- Tailored for the job description with relevant keywords
- Professionally designed with inline CSS styles (no external stylesheets)
- ATS-friendly with clear section headings
- 1-2 pages when printed as PDF
- Includes these sections: Contact Info, Professional Summary, Technical Skills, Projects/Experience, Education
- Natural and professional tone
- Do NOT use placeholder text like "undefined" or "null" anywhere
- Use actual candidate information from the resume and self description provided above`

    const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    }))

    const jsonContent = JSON.parse(response.text)

    // ✅ Log HTML preview to debug
    console.log("Generated HTML preview:", jsonContent.html?.slice(0, 300))

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }
