# 📸 사진 EXIF 분석기 - 5W1H

사진을 업로드하면 EXIF 데이터를 분석하여 5W1H(누가, 언제, 어디서, 어떻게, 왜) 정보를 시각적으로 보여주는 웹사이트입니다.

## ✨ 주요 기능

### 1. 👤 누가 (Who)
- 사진에서 얼굴을 자동으로 감지
- 감지된 얼굴을 작은 썸네일로 표시
- 얼굴 개수 정보 제공

### 2. 🕐 언제 (When)
- 사진 촬영 날짜와 시간 표시
- 한국어 형식으로 날짜 포맷팅
- 요일 정보 포함

### 3. 📍 어디서 (Where)
- GPS 좌표를 주소로 변환
- 촬영 위치 정보 표시
- 좌표 정보도 함께 제공

### 4. 🎯 어떻게 (How)
- 카메라 설정 정보 분석
- ISO, 셔터 스피드, 조리개 값 기반 활동 추론
- 촬영 환경 및 스타일 분석

### 5. 🎉 왜 (Why)
- 촬영 월에 따른 모임 정보 표시
- 계절별 이벤트 분류
- 예: "8월 모임", "여름철 모임"

## 🚀 사용법

1. **사진 업로드**
   - 드래그 앤 드롭으로 사진을 업로드하거나
   - "사진 선택" 버튼을 클릭하여 파일 선택

2. **자동 분석**
   - 업로드된 사진의 EXIF 데이터를 자동으로 분석
   - 5W1H 정보를 카드 형태로 표시

3. **결과 확인**
   - 각 카드에서 상세한 분석 결과 확인
   - 얼굴 썸네일, 위치 정보, 촬영 설정 등 확인

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **EXIF 라이브러리**: exif-js
- **얼굴 인식**: face-api.js
- **위치 변환**: Nominatim API (OpenStreetMap)
- **스타일링**: CSS Grid, Flexbox, CSS Animations

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

또는

```bash
npm start
```

### 3. 브라우저에서 접속
```
http://localhost:3000
```

## 🔧 프로젝트 구조

```
photo-exif-analyzer/
├── index.html          # 메인 HTML 파일
├── styles.css          # CSS 스타일
├── script.js           # JavaScript 로직
├── package.json        # 프로젝트 설정
└── README.md           # 프로젝트 설명
```

## 📋 요구사항

### 브라우저 지원
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### 필수 기능
- JavaScript 활성화
- 인터넷 연결 (얼굴 인식 모델 및 위치 변환 API 사용)

## 🎨 디자인 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **모던 UI**: 그라데이션 배경, 카드 레이아웃
- **애니메이션**: 부드러운 전환 효과
- **직관적 UX**: 드래그 앤 드롭, 시각적 피드백

## 🔍 EXIF 데이터 분석

### 지원하는 EXIF 태그
- **DateTimeOriginal**: 원본 촬영 날짜/시간
- **DateTime**: 수정된 날짜/시간
- **CreateDate**: 생성 날짜
- **GPSLatitude/GPSLongitude**: GPS 좌표
- **ISOSpeedRatings**: ISO 감도
- **ExposureTime**: 셔터 스피드
- **FNumber**: 조리개 값
- **Flash**: 플래시 사용 여부

### 분석 로직
1. **얼굴 인식**: face-api.js의 TinyFaceDetector 사용
2. **위치 변환**: GPS 좌표를 Nominatim API로 주소 변환
3. **활동 추론**: 카메라 설정값 기반 촬영 환경 분석
4. **이벤트 분류**: 촬영 월에 따른 계절별 모임 분류

## 🐛 알려진 이슈

- 일부 브라우저에서 CORS 정책으로 인한 API 호출 제한 가능
- 매우 큰 이미지 파일의 경우 처리 시간이 오래 걸릴 수 있음
- GPS 정보가 없는 사진의 경우 위치 정보 표시 불가

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이나 버그 리포트는 이슈를 통해 남겨주세요.

---

**© 2024 사진 EXIF 분석기 - 5W1H 분석**

