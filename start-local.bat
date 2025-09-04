@echo off
echo ========================================
echo   📸 너네 모하니 - 로컬 개발 서버 시작
echo ========================================
echo.

REM .env 파일 존재 확인
if not exist .env (
    echo ❌ .env 파일이 없습니다!
    echo.
    echo 다음 명령어로 .env 파일을 생성하세요:
    echo echo GEMINI_API_KEY=your_actual_api_key_here ^> .env
    echo.
    echo 그 후 실제 API 키로 교체하세요.
    echo.
    pause
    exit /b 1
)

REM Netlify CLI 설치 확인
netlify --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Netlify CLI가 설치되지 않았습니다!
    echo.
    echo 다음 명령어로 설치하세요:
    echo npm install -g netlify-cli
    echo.
    pause
    exit /b 1
)

echo ✅ 환경 확인 완료
echo.
echo 🚀 로컬 개발 서버를 시작합니다...
echo.
echo 브라우저에서 http://localhost:8888 을 열어주세요
echo.

REM Netlify 개발 서버 시작
netlify dev

pause
