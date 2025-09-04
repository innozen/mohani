# 📸 너네 모하니 - 사진 분석 및 AI 일기 생성기

사진의 EXIF 데이터를 분석하여 5W1H 정보를 추출하고, Gemini AI를 활용해 감성적인 일기를 자동 생성하는 웹 애플리케이션입니다.

## ✨ 주요 기능

- 📷 **사진 업로드**: 드래그 앤 드롭 또는 클릭으로 사진 업로드
- 🔍 **EXIF 분석**: 촬영 시간, 위치, 카메라 설정 등 메타데이터 추출
- 👤 **얼굴 인식**: Face-api.js를 활용한 자동 얼굴 감지
- 📍 **위치 정보**: GPS 좌표를 주소로 변환
- 🤖 **AI 일기 생성**: Gemini AI를 활용한 감성적인 일기 자동 작성
- 📱 **반응형 디자인**: 모바일과 데스크톱 모두 지원

## 🚀 배포 방법

### 1. Netlify에 배포

1. 이 저장소를 GitHub에 업로드
2. Netlify에서 새 사이트 생성
3. GitHub 저장소 연결
4. 환경변수 설정 (아래 참조)

### 2. 환경변수 설정

Netlify 대시보드에서 다음 환경변수를 설정하세요:

```
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

**Gemini API 키 발급 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키를 복사하여 환경변수에 설정

### 3. 로컬 개발

#### 3-1. Netlify CLI 설치
```bash
# Netlify CLI 전역 설치
npm install -g netlify-cli

# 또는 npx로 실행 (설치 없이)
npx netlify-cli
```

#### 3-2. 환경변수 설정
```bash
# 저장소 클론
git clone <your-repo-url>
cd photo-exif-analyzer

# .env 파일 생성
echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" > .env

# .env 파일 편집하여 실제 API 키 설정
# Windows: notepad .env
# Mac/Linux: nano .env 또는 vim .env
```

#### 3-3. 로컬 서버 실행
```bash
# Netlify 개발 서버 시작
netlify dev

# 또는 npx 사용
npx netlify dev
```

#### 3-4. 브라우저에서 확인
- 자동으로 브라우저가 열리거나
- 수동으로 `http://localhost:8888` 접속

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Netlify Functions (Node.js)
- **AI**: Google Gemini API
- **이미지 처리**: EXIF.js, Face-api.js
- **배포**: Netlify

## 📁 프로젝트 구조

```
photo-exif-analyzer/
├── index.html              # 메인 HTML 파일
├── script.js               # 프론트엔드 JavaScript
├── styles.css              # CSS 스타일
├── netlify/
│   └── functions/
│       └── generate-diary.js  # Gemini API 프록시 함수
├── env-example.txt         # 환경변수 설정 예시
└── README.md              # 프로젝트 문서
```

## 🔒 보안

- API 키는 서버 사이드에서만 사용되며 클라이언트에 노출되지 않습니다
- Netlify Functions를 통해 안전하게 Gemini API를 호출합니다
- CORS 정책이 적절히 설정되어 있습니다

## 🎯 사용 방법

1. **사진 업로드**: 메인 화면에서 사진을 드래그하거나 클릭하여 업로드
2. **분석 대기**: 자동으로 EXIF 데이터와 얼굴 인식이 진행됩니다
3. **결과 확인**: 5W1H 분석 결과를 확인합니다
4. **일기 생성**: "일기 생성하기" 버튼을 클릭하여 AI 일기를 생성합니다

## 🐛 문제 해결

### API 키 관련 오류
- Gemini API 키가 올바르게 설정되었는지 확인
- API 키의 권한과 할당량을 확인
- Netlify 환경변수가 올바르게 설정되었는지 확인

### 이미지 업로드 오류
- 지원되는 이미지 형식인지 확인 (JPEG, PNG, WebP 등)
- 이미지 파일 크기가 너무 크지 않은지 확인
- 브라우저의 JavaScript가 활성화되어 있는지 확인

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 기능 요청이 있으시면 GitHub Issues를 통해 문의해주세요.