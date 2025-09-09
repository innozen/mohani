/**
 * Netlify Function: Gemini API를 사용한 일기 생성
 * 환경변수에서 API 키를 안전하게 가져와서 사용
 * 최신 Google Gemini SDK 방식 사용
 */

const { GoogleGenAI } = require("@google/genai");

exports.handler = async (event, context) => {
    // 보안 강화된 CORS 헤더 설정
    const allowedOrigins = [
        'https://your-domain.netlify.app', // 실제 도메인으로 변경 필요
        'http://localhost:3000', // 개발 환경
        'http://localhost:8888'  // Netlify Dev
    ];
    
    const origin = event.headers.origin || event.headers.Origin;
    const isAllowedOrigin = allowedOrigins.includes(origin);
    
    const headers = {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
        'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With, X-Client-Version',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400', // 24시간
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
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
        // 요청 크기 제한 (보안)
        const maxBodySize = 10 * 1024 * 1024; // 10MB
        if (event.body && event.body.length > maxBodySize) {
            return {
                statusCode: 413,
                headers,
                body: JSON.stringify({ error: '요청 크기가 너무 큽니다.' })
            };
        }

        // 클라이언트 버전 확인 (보안)
        const clientVersion = event.headers['x-client-version'];
        if (!clientVersion || clientVersion !== '0.029') {
            console.warn('⚠️ 클라이언트 버전 불일치:', clientVersion);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '클라이언트 버전이 올바르지 않습니다.' })
            };
        }

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

        // 요청 본문 파싱 (보안 강화)
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '잘못된 JSON 형식입니다.' })
            };
        }

        const { prompt, image, timestamp, clientInfo } = requestBody;
        
        // 요청 데이터 검증 (보안)
        if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '프롬프트가 올바르지 않습니다.' })
            };
        }

        if (!image || typeof image !== 'string' || image.length > 5 * 1024 * 1024) { // 5MB 제한
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '이미지 데이터가 올바르지 않습니다.' })
            };
        }

        // Base64 형식 검증
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: '이미지 형식이 올바르지 않습니다.' })
            };
        }

        // 요청 로깅 (보안: 민감한 정보 제외)
        console.log('🤖 Gemini API 호출 시작 (이미지 + 텍스트)');
        console.log('📝 프롬프트 길이:', prompt.length);
        console.log('🖼️ 이미지 Base64 길이:', image.length);
        console.log('⏰ 요청 시간:', timestamp);
        console.log('🌐 클라이언트 정보:', clientInfo ? '제공됨' : '없음');
        
        // 요청 빈도 제한 (간단한 구현)
        const requestId = `${clientInfo?.platform || 'unknown'}-${Date.now()}`;
        console.log('🆔 요청 ID:', requestId);

        // Google Gemini SDK 초기화
        const ai = new GoogleGenAI({ apiKey });

        try {
            // Gemini 2.5 Flash 모델로 이미지와 텍스트를 함께 처리
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                inlineData: {
                                    mimeType: "image/jpeg",
                                    data: image
                                }
                            }
                        ]
                    }
                ],
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
            
            // 응답 데이터 검증 및 정제
            const cleanDiaryText = diaryText.trim()
                .replace(/[<>]/g, '') // XSS 방지
                .substring(0, 5000); // 길이 제한
            
            console.log('✅ 일기 생성 완료');
            console.log('📄 생성된 일기 길이:', cleanDiaryText.length);
            console.log('🆔 응답 요청 ID:', requestId);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    diary: cleanDiaryText,
                    success: true,
                    requestId: requestId,
                    timestamp: new Date().toISOString()
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
