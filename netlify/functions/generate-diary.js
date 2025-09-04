/**
 * Netlify Function: Gemini API를 사용한 일기 생성
 * 환경변수에서 API 키를 안전하게 가져와서 사용
 * 최신 Google Gemini SDK 방식 사용
 */

const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
    // CORS 헤더 설정
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // POST 요청만 허용
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // 환경변수에서 API 키 가져오기
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'API 키가 설정되지 않았습니다. 서버 관리자에게 문의하세요.' 
                })
            };
        }

        // 요청 본문 파싱
        const requestBody = JSON.parse(event.body);
        const { prompt } = requestBody;

        if (!prompt) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '프롬프트가 필요합니다.' })
            };
        }

        console.log('🤖 Gemini API 호출 시작 (SDK 방식)');
        console.log('📝 프롬프트 길이:', prompt.length);

        // Google Gemini SDK 초기화
        const ai = new GoogleGenAI({ apiKey });

        try {
            // Gemini 2.5 Flash 모델로 일기 생성
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            });

            if (!response || !response.text) {
                throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
            }

            const diaryText = response.text;
            
            console.log('✅ 일기 생성 완료');
            console.log('📄 생성된 일기 길이:', diaryText.length);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    diary: diaryText.trim(),
                    success: true 
                })
            };

        } catch (apiError) {
            console.error('❌ Gemini SDK 오류:', apiError);
            
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: `Gemini API 오류: ${apiError.message}` 
                })
            };
        }

    } catch (error) {
        console.error('❌ 서버 오류:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: '서버 내부 오류가 발생했습니다.',
                details: error.message 
            })
        };
    }
};
