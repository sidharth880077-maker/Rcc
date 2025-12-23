
import { GoogleGenAI } from "@google/genai";
import { TestRecord, AttendanceRecord } from '../types';

export const getStudentPerformanceInsights = async (
  studentName: string,
  tests: TestRecord[],
  attendance: AttendanceRecord[]
): Promise<string> => {
  const prompt = `
    Analyze the following performance data for student: ${studentName}.
    
    Test Scores:
    ${tests.map(t => `${t.subject}: ${t.marksObtained}/${t.totalMarks} (${t.date})`).join('\n')}
    
    Attendance History:
    ${attendance.map(a => `${a.date}: ${a.status}`).join('\n')}
    
    Provide a professional but encouraging summary of the student's progress, highlighting strengths and areas for improvement.
    Limit the response to 150 words.
  `;

  try {
    // Fix: Always initialize GoogleGenAI inside the function using process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Use the .text property directly instead of calling it as a method
    return response.text || "Insight generation failed.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Error generating insights. Please check your API key.";
  }
};
