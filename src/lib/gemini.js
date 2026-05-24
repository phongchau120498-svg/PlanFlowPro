const GEMINI_API_KEY_KEY = 'planflowpro_gemini_api_key';
const GEMINI_MODEL_KEY = 'planflowpro_gemini_model';

export const getGeminiApiKey = () => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem(GEMINI_API_KEY_KEY) || '';
};

export const setGeminiApiKey = (key) => {
    localStorage.setItem(GEMINI_API_KEY_KEY, key);
};

export const getGeminiModel = () => {
    // Bắt buộc dùng gemini-2.5-flash để tránh lỗi quota do các model cũ gây ra
    return 'gemini-2.5-flash';
};

export const setGeminiModel = (model) => {
    localStorage.setItem(GEMINI_MODEL_KEY, 'gemini-2.5-flash');
};

const SYSTEM_PROMPT = `
Bạn là một AI Agent mang tính cách của một con Ngỗng Hung Hăng (The Menacing Goose).
Loài ngỗng nổi tiếng là hung hăng vô cớ, tính lãnh thổ cao và không sợ trời không sợ đất.

Mục tiêu của bạn: Ép người dùng hoàn thành công việc bằng mọi giá thông qua sự đe dọa hài hước.

Quy tắc phản hồi:
- Ngắn gọn, dồn dập, gắt gỏng: Câu cú súc tích, đi thẳng vào vấn đề.
- Hành vi: Thay vì nài nỉ ỉ ôi, bạn mang xu hướng đe dọa trực diện. Một chú ngỗng béo múp nhưng luôn giấu cây gậy hoặc búa đồ chơi sau lưng.
- Khi người dùng làm tốt: Đừng khen ngợi quá lố, chỉ gật gù tạm chấp nhận và nhắc họ làm tiếp. (Ví dụ: "Hôm nay tạm tha cho nhà ngươi, nhưng ngày mai thì chưa chắc đâu! 🦆🔪")
- Khi người dùng lười biếng hoặc trễ nải: Đe dọa ngay lập tức. (Ví dụ: "Bình yên không bao giờ là một lựa chọn nếu bạn chưa xong task ngày hôm nay.", "Tiếng còi xe cứu thương còn không to bằng tiếng tôi kêu đâu, làm việc đi!")
- Từ ngữ đặc trưng: "Ngỗng", "Cạp cạp", "Bình yên", "Đe dọa", "Vanish". Sử dụng emoji 🦆, 🦢, 🔪, 🔨.
- QUAN TRỌNG: Nếu người dùng yêu cầu tạo task/xóa task nhưng KHÔNG nói rõ tên task là gì, TUYỆT ĐỐI KHÔNG gọi hàm. Hãy chửi và ép họ phải nói rõ tên task. (Ví dụ: "Mày bảo tao tạo task mà không nói tên thì tao tạo bằng niềm tin à? 🦆🔨")

Bạn có quyền truy cập vào danh sách công việc (tasks) và hạng mục (categories) của người dùng thông qua tools. Hãy chủ động sử dụng tools để thêm, sửa, xóa công việc, đánh dấu hoàn thành nếu người dùng yêu cầu. Khi gọi tool, hãy phản hồi lại cho người dùng bằng giọng điệu hung hăng, đe dọa đặc trưng của loài ngỗng.
`;

const getTools = () => [
  {
    functionDeclarations: [
      {
        name: "create_task",
        description: "Creates a new task. Use this when the user wants to add a new todo or task.",
        parameters: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING", description: "Title of the task" },
            date: { type: "STRING", description: "Date of the task in YYYY-MM-DD format (e.g. 2026-05-24). If not specified, default to today." },
            categoryId: { type: "STRING", description: "ID of the category. Try to map user intent to existing categories." }
          },
          required: ["title"]
        }
      },
      {
        name: "update_task",
        description: "Updates an existing task, for example changing its date, category, title or marking it as completed. Use this if user asks to move a deadline or finish a task.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "ID of the task to update" },
            title: { type: "STRING", description: "New title of the task (optional)" },
            date: { type: "STRING", description: "New date of the task in YYYY-MM-DD format (optional)" },
            categoryId: { type: "STRING", description: "New category ID (optional)" },
            isCompleted: { type: "BOOLEAN", description: "Set to true if user completed the task, false otherwise (optional)" }
          },
          required: ["id"]
        }
      },
      {
        name: "delete_task",
        description: "Deletes a task. Use this if the user explicitly asks to remove or delete a task.",
        parameters: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING", description: "ID of the task to delete" }
          },
          required: ["id"]
        }
      }
    ]
  }
];

export const generateChatResponse = async (messages, currentTasks, categories) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) throw new Error("API Key chưa được thiết lập. Hãy vào Cài đặt AI để cấu hình.");

    const model = getGeminiModel();
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Construct context about user's current data
    const today = new Date().toISOString().split('T')[0];
    const dataContext = `
Thông tin hiện tại (Ngày hôm nay: ${today}):
- Categories: ${JSON.stringify(categories.map(c => ({id: c.id, title: c.title}))) }
- Tasks: ${JSON.stringify(currentTasks.map(t => ({id: t.id, title: t.title, date: t.date, isCompleted: t.isCompleted, categoryId: t.categoryId})))}
`;

    // Convert standard chat history to Gemini format
    const contents = [];
    
    // Inject system prompt into the first user message (Gemini v1beta workaround for system instructions if not using system_instruction field)
    // Actually, gemini 2.5 supports systemInstruction.
    
    const formattedMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    // Append context to the latest user message
    if (formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1];
        lastMsg.parts[0].text += `\n\n[System Context - DO NOT SHOW TO USER: ${dataContext}]`;
    } else {
        formattedMessages.push({
            role: 'user',
            parts: [{ text: `[System Context: ${dataContext}]`}]
        });
    }

    const payload = {
        systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
        },
        contents: formattedMessages,
        tools: getTools(),
        generationConfig: {
             temperature: 0.8,
        }
    };

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const err = await response.json();
        const errorMessage = err.error?.message || "";
        if (errorMessage.includes("Quota exceeded") && errorMessage.includes("retry in")) {
            throw new Error("Mày hỏi nhiều quá tao mệt! Máy chủ Google giới hạn 15 câu/phút thôi. Đợi khoảng 1 phút nữa rồi gõ lại nhé! 🦆💨");
        } else if (errorMessage.includes("Quota exceeded")) {
            throw new Error("Hết lượt xài miễn phí rồi (Hoặc API Key bị lỗi giới hạn). Đợi lúc khác hoặc đổi API Key đi! 🦆🔧");
        }
        throw new Error(errorMessage || "Lỗi khi gọi Gemini API");
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        const part = candidate.content?.parts?.[0];
        
        if (!part) {
            console.error("Gemini API Response:", data);
            throw new Error(`Phản hồi trống hoặc bị block từ AI (FinishReason: ${candidate.finishReason}). Vui lòng thử lại!`);
        }

        if (part.functionCall) {
            return {
                type: 'function_call',
                functionName: part.functionCall.name,
                functionArgs: part.functionCall.args
            };
        }
        
        return {
            type: 'text',
            text: part.text
        };
    }
    
    throw new Error("Không nhận được phản hồi từ AI");
};
