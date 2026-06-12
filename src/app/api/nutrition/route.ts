import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured. Using mock fallback mode.");
      return NextResponse.json(generateMockNutrition(text));
    }

    // Call Google Gemini API (Using gemini-2.5-flash for speed and structured outputs)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze the food item and quantity in the user's natural language input: "${text}".
                  
Calculate the nutritional values (calories, protein, carbs, fat, fiber). The values MUST represent the actual quantity/portion specified in the user's input (e.g., if it says "2 pieces" or "2 plates", multiply accordingly).
Provide a cute, encouraging message in Thai (with emojis) in the 'quality_summary' field under the Mochi bunny character persona.

Return the response strictly as a JSON object matching this schema:
{
  "meal_name": "Name of the food (in Thai)",
  "calories": number of kcal (integer),
  "protein": grams of protein (number),
  "carbs": grams of carbs (number),
  "fat": grams of fat (number),
  "fiber": grams of fiber (number),
  "quality_summary": "Cute Thai advice message (under 120 characters)"
}
`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                meal_name: { type: "STRING" },
                calories: { type: "INTEGER" },
                protein: { type: "NUMBER" },
                carbs: { type: "NUMBER" },
                fat: { type: "NUMBER" },
                fiber: { type: "NUMBER" },
                quality_summary: { type: "STRING" }
              },
              required: ["meal_name", "calories", "protein", "carbs", "fat", "fiber", "quality_summary"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error response:", errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const result = await response.json();
    const outputText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!outputText) {
      throw new Error("Empty response from Gemini API");
    }

    const parsedJson = JSON.parse(outputText);
    return NextResponse.json(parsedJson);

  } catch (error: any) {
    console.error("API nutrition error:", error);
    // If API fails, use mock fallback so the application is robust
    try {
      const { text } = await request.clone().json();
      return NextResponse.json(generateMockNutrition(text));
    } catch {
      return NextResponse.json({ error: error.message || "Failed to analyze nutrition" }, { status: 500 });
    }
  }
}

// Smart mock nutrition generator as fallback
function generateMockNutrition(text: string) {
  const normalized = text.toLowerCase();
  
  // Extract number of servings/portions if specified
  let portion = 1;
  const match = text.match(/(\d+(\.\d+)?)/);
  if (match) {
    portion = parseFloat(match[1]) || 1;
  }

  if (normalized.includes("อกไก่") || normalized.includes("chicken breast")) {
    return {
      meal_name: "อกไก่",
      calories: Math.round(150 * portion),
      protein: parseFloat((25 * portion).toFixed(1)),
      carbs: parseFloat((0 * portion).toFixed(1)),
      fat: parseFloat((3 * portion).toFixed(1)),
      fiber: parseFloat((0 * portion).toFixed(1)),
      quality_summary: `มื้ออกไก่ลีนๆ โปรตีนชั้นยอดเลยค่ะ! ซ่อมแซมกล้ามเนื้อได้ดีเลิศ 🐔✨ (โหมดออฟไลน์)`
    };
  }
  
  if (normalized.includes("สลัด") || normalized.includes("salad") || normalized.includes("ผัก")) {
    return {
      meal_name: "สลัดผัก",
      calories: Math.round(90 * portion),
      protein: parseFloat((2 * portion).toFixed(1)),
      carbs: parseFloat((12 * portion).toFixed(1)),
      fat: parseFloat((2 * portion).toFixed(1)),
      fiber: parseFloat((4 * portion).toFixed(1)),
      quality_summary: `ผักใบเขียวใยอาหารสูง วิตามินจัดเต็ม ช่วยให้ระบบขับถ่ายทำงานได้ดีเยี่ยมค่ะ 🥦🥗 (โหมดออฟไลน์)`
    };
  }

  if (normalized.includes("ไข่ต้ม") || normalized.includes("egg")) {
    return {
      meal_name: "ไข่ต้ม",
      calories: Math.round(75 * portion),
      protein: parseFloat((6.5 * portion).toFixed(1)),
      carbs: parseFloat((0.6 * portion).toFixed(1)),
      fat: parseFloat((5 * portion).toFixed(1)),
      fiber: parseFloat((0 * portion).toFixed(1)),
      quality_summary: `โปรตีนจากไข่ต้มคุณภาพสูง พลังงานสะอาดรองท้องได้ดีเยี่ยมค่ะ 🥚✨ (โหมดออฟไลน์)`
    };
  }

  if (normalized.includes("ชานม") || normalized.includes("boba") || normalized.includes("ไข่มุก")) {
    return {
      meal_name: "ชานมไข่มุก",
      calories: Math.round(360 * portion),
      protein: parseFloat((2 * portion).toFixed(1)),
      carbs: parseFloat((65 * portion).toFixed(1)),
      fat: parseFloat((11 * portion).toFixed(1)),
      fiber: parseFloat((0.5 * portion).toFixed(1)),
      quality_summary: `อุ๊ย! มื้อนี้มีความหวานและแป้งสูงไปหน่อยน้า คุมอาหารหมวดแป้งในมื้ออื่นดีๆ นะคะ 🥺🍬 (โหมดออฟไลน์)`
    };
  }

  if (normalized.includes("ข้าวมันไก่")) {
    return {
      meal_name: "ข้าวมันไก่",
      calories: Math.round(590 * portion),
      protein: parseFloat((18 * portion).toFixed(1)),
      carbs: parseFloat((75 * portion).toFixed(1)),
      fat: parseFloat((22 * portion).toFixed(1)),
      fiber: parseFloat((1.5 * portion).toFixed(1)),
      quality_summary: `คาร์บและไขมันอิ่มตัวค่อนข้างสูงน้า จิบน้ำมะนาวช่วยลดความเลี่ยนและช่วยย่อยนะคะ 🍋🐔 (โหมดออฟไลน์)`
    };
  }

  // General fallback defaults
  const cleanName = text.replace(/[\d\sจานแก้วชิ้นถ้วยฟองกล่อง]/g, "") || "อาหารวิเคราะห์พิเศษ";
  return {
    meal_name: cleanName,
    calories: Math.round(220 * portion),
    protein: parseFloat((8 * portion).toFixed(1)),
    carbs: parseFloat((30 * portion).toFixed(1)),
    fat: parseFloat((7 * portion).toFixed(1)),
    fiber: parseFloat((2 * portion).toFixed(1)),
    quality_summary: `วิเคราะห์ "${text}" เรียบร้อยแล้วค่ะ อย่าลืมดื่มน้ำเยอะๆ และออกกำลังกายนะคนเก่ง 🐰✨ (โหมดออฟไลน์)`
  };
}
