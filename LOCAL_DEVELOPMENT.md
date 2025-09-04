# 🛠️ 로컬 개발 가이드

이 가이드는 photo-exif-analyzer 프로젝트를 로컬에서 개발하고 테스트하는 방법을 설명합니다.

## 📋 사전 요구사항

- Node.js (v14 이상)
- npm 또는 yarn
- Gemini API 키

## 🚀 빠른 시작

### 1단계: Netlify CLI 설치

```bash
# 전역 설치 (권장)
npm install -g netlify-cli

# 설치 확인
netlify --version
```

### 2단계: 환경변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하세요:

```bash
# Windows
echo GEMINI_API_KEY=your_actual_api_key_here > .env

# Mac/Linux
echo "GEMINI_API_KEY=your_actual_api_key_here" > .env
```

**중요**: `your_actual_api_key_here`를 실제 Gemini API 키로 교체하세요!

### 3단계: 로컬 서버 실행

```bash
# Netlify 개발 서버 시작
netlify dev
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:
```
◈ Netlify Dev ◈
◈ Server now ready on http://localhost:8888
◈ Functions server is running on port 8889
```

### 4단계: 브라우저에서 확인

- 자동으로 브라우저가 열리거나
- 수동으로 `http://localhost:8888` 접속

## 🔧 개발 모드 기능

### Hot Reload
- 파일을 수정하면 자동으로 브라우저가 새로고침됩니다
- CSS와 JavaScript 변경사항이 즉시 반영됩니다

### Functions 로그
- 터미널에서 Netlify Functions의 로그를 실시간으로 확인할 수 있습니다
- API 호출 상태와 오류를 모니터링할 수 있습니다

### 환경변수 자동 로드
- `.env` 파일의 환경변수가 자동으로 로드됩니다
- API 키가 안전하게 Functions에서 사용됩니다

## 🐛 문제 해결

### 포트 충돌
```bash
# 다른 포트 사용
netlify dev --port 3000
```

### 환경변수 인식 안됨
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일명이 정확히 `.env`인지 확인 (확장자 없음)
3. 서버를 재시작해보세요

### API 키 오류
1. API 키가 올바른지 확인
2. Gemini API 할당량이 남아있는지 확인
3. 브라우저 개발자 도구의 Network 탭에서 API 호출 상태 확인

### Functions 오류
```bash
# Functions 로그 확인
netlify functions:list
netlify functions:invoke generate-diary
```

## 📁 프로젝트 구조

```
photo-exif-analyzer/
├── .env                    # 환경변수 (생성 필요)
├── netlify.toml           # Netlify 설정
├── index.html             # 메인 페이지
├── script.js              # 프론트엔드 로직
├── styles.css             # 스타일시트
├── netlify/
│   └── functions/
│       └── generate-diary.js  # API 함수
└── README.md              # 프로젝트 문서
```

## 🔄 개발 워크플로우

1. **코드 수정**: HTML, CSS, JavaScript 파일 편집
2. **자동 새로고침**: 브라우저에서 변경사항 확인
3. **API 테스트**: 일기 생성 기능 테스트
4. **오류 확인**: 터미널과 브라우저 개발자 도구에서 로그 확인

## 🚀 배포 전 체크리스트

- [ ] 모든 기능이 로컬에서 정상 작동하는지 확인
- [ ] API 키가 올바르게 설정되었는지 확인
- [ ] 오류 처리가 적절히 구현되었는지 확인
- [ ] 모바일 반응형이 정상 작동하는지 확인

## 💡 개발 팁

### 디버깅
```bash
# 상세 로그와 함께 실행
netlify dev --debug

# 특정 함수만 테스트
netlify functions:invoke generate-diary --payload '{"prompt":"test"}'
```

### 성능 모니터링
- 브라우저 개발자 도구의 Performance 탭 활용
- Network 탭에서 API 호출 시간 확인
- Console 탭에서 JavaScript 오류 확인

## 📞 도움이 필요하신가요?

- GitHub Issues에 문제를 보고해주세요
- README.md의 문제 해결 섹션을 확인해주세요
- Netlify CLI 문서: https://docs.netlify.com/cli/get-started/
