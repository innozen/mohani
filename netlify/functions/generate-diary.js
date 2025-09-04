/**
 * Netlify Function: Gemini API를 사용한 일기 생성
 * 환경변수에서 API 키를 안전하게 가져와서 사용
 */

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

        console.log('🤖 Gemini API 호출 시작');
        console.log('📝 프롬프트 길이:', prompt.length);

        // Gemini API 호출 (gemini-2.5-flash 모델 사용)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const geminiRequestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiRequestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Gemini API 오류:', errorData);
            
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ 
                    error: `Gemini API 오류: ${errorData.error?.message || response.statusText}` 
                })
            };
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('❌ Gemini API 응답 형식 오류:', data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API 응답 형식이 올바르지 않습니다.' })
            };
        }

        const diaryText = data.candidates[0].content.parts[0].text;
        
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
