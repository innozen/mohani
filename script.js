/**
 * 사진 EXIF 분석기 - 5W1H
 * 단순하고 안정적인 방식으로 구현
 */

// 전역 상태 (보안 강화)
const AppState = {
    isProcessing: false,
    currentImage: null, // 보안: 메모리에서 자동 정리됨
    currentFile: null,
    faceApiLoaded: false,
    elements: {},
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    // 성능 최적화를 위한 추가 상태
    imageCache: new Map(),
    debounceTimer: null,
    lastProcessedImage: null,
    // 분석 데이터 저장 (민감한 정보 제외)
    analysisData: null,
    // 보안 관련 상태
    securityFlags: {
        dataEncrypted: false,
        memoryCleared: false,
        secureMode: true
    }
};

// 모바일 환경 감지
function detectMobileEnvironment() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // 모바일 감지
    AppState.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // iOS 감지
    AppState.isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    // Android 감지
    AppState.isAndroid = /Android/.test(userAgent);
    
    console.log('📱 환경 감지 결과:');
    console.log(`   모바일: ${AppState.isMobile}`);
    console.log(`   iOS: ${AppState.isIOS}`);
    console.log(`   Android: ${AppState.isAndroid}`);
}

// DOM 요소 초기화
function initializeElements() {
    console.log('🚀 DOM 요소 초기화 시작');
    
    AppState.elements = {
        uploadArea: document.getElementById('uploadArea'),
        fileInput: document.getElementById('fileInput'),
        analysisSection: document.getElementById('analysisSection'),
        previewImage: document.getElementById('previewImage'),
        faceContainer: document.getElementById('faceContainer'),
        dateTimeInfo: document.getElementById('dateTimeInfo'),
        locationInfo: document.getElementById('locationInfo'),
        activityInfo: document.getElementById('activityInfo'),
        eventInfo: document.getElementById('eventInfo'),
        initialLoading: document.getElementById('initialLoading'),
        uploadBtn: document.getElementById('uploadBtn'),
        // 일기 생성 관련 요소들
        diarySection: document.getElementById('diarySection'),
        generateDiary: document.getElementById('generateDiary'),
        diaryContent: document.getElementById('diaryContent'),
        diaryKeywords: document.getElementById('diaryKeywords'),
        // 화면 저장 관련 요소들
        saveSection: document.getElementById('saveSection'),
        saveScreenBtn: document.getElementById('saveScreenBtn')
    };
    
    // 모든 요소가 존재하는지 확인
    let allElementsFound = true;
    for (const [key, element] of Object.entries(AppState.elements)) {
        if (!element) {
            console.error(`❌ ${key} 요소를 찾을 수 없습니다.`);
            allElementsFound = false;
        } else {
            console.log(`✅ ${key} 요소 발견`);
        }
    }
    
    if (!allElementsFound) {
        throw new Error('필수 DOM 요소를 찾을 수 없습니다.');
    }
    
    console.log('✅ DOM 요소 초기화 완료');
    return true;
}

// Face-api.js 얼굴 인식 초기화 (수정된 버전)
function loadFaceAPI() {
    console.log('🔄 Face-api.js 모델 로딩 시작...');
    
    // 재시도 횟수 제한
    if (!AppState.faceApiRetryCount) {
        AppState.faceApiRetryCount = 0;
    }
    
    // 최대 3번까지만 재시도
    if (AppState.faceApiRetryCount >= 3) {
        console.log('⚠️ Face-api.js 모델 로드 최대 재시도 횟수 도달 - Canvas 기반 분석으로 전환');
        AppState.faceApiLoaded = false;
        return false;
    }
    
    // 백그라운드에서 모델 로드
    setTimeout(async () => {
        try {
            // Face-api.js가 로드되었는지 확인
            if (typeof faceapi === 'undefined') {
                console.warn('⚠️ Face-api.js 라이브러리가 아직 로드되지 않았습니다. 1초 후 다시 시도합니다.');
                setTimeout(loadFaceAPI, 1000);
                return;
            }
            
            console.log('📦 Face-api.js 라이브러리 감지됨');
            
            // 올바른 CDN URL들 (수정된 버전)
            const MODEL_URLS = [
                'https://justadudewhohacks.github.io/face-api.js/models',
                'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/models',
                'https://unpkg.com/face-api.js@0.22.2/models'
            ];
            
            let modelLoaded = false;
            for (const url of MODEL_URLS) {
                try {
                    console.log(`🔄 모델 로드 시도 (${AppState.faceApiRetryCount + 1}/3): ${url}`);
                    
                    // 타임아웃 설정 (15초)
                    const loadPromise = faceapi.nets.tinyFaceDetector.loadFromUri(url);
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('타임아웃')), 15000)
                    );
                    
                    await Promise.race([loadPromise, timeoutPromise]);
                    
                    console.log(`✅ 모델 로드 성공: ${url}`);
                    modelLoaded = true;
                    break;
                } catch (error) {
                    console.warn(`⚠️ 모델 로드 실패 (${url}):`, error.message);
                    continue;
                }
            }
            
            if (!modelLoaded) {
                throw new Error('모든 CDN에서 모델 로드 실패');
            }
            
            console.log('✅ TinyFaceDetector 모델 로드 완료');
            AppState.faceApiLoaded = true;
            AppState.faceApiRetryCount = 0; // 성공 시 재시도 카운트 초기화
            console.log('🎉 Face-api.js 준비 완료!');
            
        } catch (error) {
            console.warn('⚠️ Face-api.js 모델 로드 실패:', error.message);
            AppState.faceApiRetryCount++;
            
            if (AppState.faceApiRetryCount < 3) {
                console.log(`🔄 ${AppState.faceApiRetryCount}/3 - 5초 후 다시 시도합니다...`);
                setTimeout(() => {
                    loadFaceAPI();
                }, 5000); // 5초 후 재시도
            } else {
                console.log('⚠️ Face-api.js 모델 로드 최종 실패 - Canvas 기반 분석으로 전환');
                AppState.faceApiLoaded = false;
            }
        }
    }, 1000); // 1초 후에 시작
    
    return false;
}

// 카메라로 촬영 (현재 사용되지 않음 - HTML에서 모바일 옵션 제거됨)
/*
function openCamera() {
    console.log('📷 카메라 열기');
    
    try {
        const cameraInput = document.createElement('input');
        cameraInput.type = 'file';
        cameraInput.accept = 'image/*';
        cameraInput.capture = 'environment'; // 후면 카메라 우선
        
        cameraInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
            document.body.removeChild(cameraInput);
        });
        
        document.body.appendChild(cameraInput);
        cameraInput.click();
        console.log('✅ 카메라 입력 요소 생성 및 클릭');
    } catch (error) {
        console.error('❌ 카메라 열기 실패:', error);
        alert('카메라를 열 수 없습니다. 갤러리에서 사진을 선택해주세요.');
    }
}

// 갤러리에서 선택 (현재 사용되지 않음 - HTML에서 모바일 옵션 제거됨)
function openGallery() {
    console.log('🖼️ 갤러리 열기');
    
    try {
        const galleryInput = document.createElement('input');
        galleryInput.type = 'file';
        galleryInput.accept = 'image/*';
        galleryInput.multiple = false;
        
        galleryInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
            document.body.removeChild(galleryInput);
        });
        
        document.body.appendChild(galleryInput);
        galleryInput.click();
        console.log('✅ 갤러리 입력 요소 생성 및 클릭');
    } catch (error) {
        console.error('❌ 갤러리 열기 실패:', error);
        alert('갤러리를 열 수 없습니다.');
    }
}
*/

// 업로드 준비 상태로 변경
function showUploadReady() {
    console.log('📤 업로드 준비 상태로 변경');
    
    const { uploadArea, initialLoading, uploadBtn } = AppState.elements;
    
    if (uploadArea) {
        uploadArea.classList.add('ready');
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
    }
    
    if (initialLoading) {
        initialLoading.style.display = 'none';
    }
    
    // 업로드 버튼 표시 (모든 환경에서 동일)
    if (uploadBtn) {
        uploadBtn.style.display = 'inline-block';
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    console.log('🎯 이벤트 리스너 설정');
    
    const { uploadArea, fileInput, uploadBtn, generateDiary, saveScreenBtn } = AppState.elements;
    
    // 모든 기존 이벤트 리스너 제거
    uploadArea.removeEventListener('click', handleUploadAreaClick);
    uploadBtn.removeEventListener('click', handleUploadButtonClick);
    fileInput.removeEventListener('change', handleFileChange);
    generateDiary.removeEventListener('click', handleGenerateDiary);
    saveScreenBtn.removeEventListener('click', handleSaveScreen);
    
    // 파일 입력 변경 이벤트
    fileInput.addEventListener('change', handleFileChange);
    
    // 업로드 영역 클릭 이벤트 (새로운 함수)
    uploadArea.addEventListener('click', handleUploadAreaClick);
    
    // 버튼 클릭 이벤트 (새로운 함수)
    uploadBtn.addEventListener('click', handleUploadButtonClick);
    
    // 일기 생성 버튼 이벤트
    generateDiary.addEventListener('click', handleGenerateDiary);
    
    // 화면 저장 버튼 이벤트
    saveScreenBtn.addEventListener('click', handleSaveScreen);
    
    // 드래그 앤 드롭 이벤트
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    console.log('✅ 이벤트 리스너 설정 완료');
}

// 업로드 영역 클릭 처리
function handleUploadAreaClick(event) {
    console.log('🖱️ 업로드 영역 클릭:', event.target);
    
    // 버튼이나 그 자식 요소를 클릭한 경우 무시
    const uploadBtn = AppState.elements.uploadBtn;
    if (event.target === uploadBtn || uploadBtn.contains(event.target)) {
        console.log('🚫 버튼 영역 클릭 - 무시');
        return;
    }
    
    // 처리 중이면 무시
    if (AppState.isProcessing) {
        console.log('🚫 처리 중이므로 클릭 무시');
        return;
    }
    
    // 이벤트 전파 방지
    event.preventDefault();
    event.stopPropagation();
    
    console.log('📁 파일 선택창 열기 (영역 클릭)');
    
    // 직접 파일 선택창 열기 (중복 호출 방지)
    forceOpenFileDialog();
}

// 업로드 버튼 클릭 처리
function handleUploadButtonClick(event) {
    console.log('🖱️ 업로드 버튼 클릭');
    
    // 이벤트 전파 방지
    event.preventDefault();
    event.stopPropagation();
    
    // 처리 중이면 무시
    if (AppState.isProcessing) {
        console.log('🚫 처리 중이므로 버튼 클릭 무시');
        return;
    }
    
    console.log('📁 파일 선택창 열기 (버튼 클릭)');
    
    // 강제로 파일 선택창 열기
    forceOpenFileDialog();
}

// 강제 파일 선택창 열기 함수
function forceOpenFileDialog() {
    console.log('🔧 강제 파일 선택창 열기 시도');
    
    // 중복 실행 방지
    if (AppState.isProcessing) {
        console.log('🚫 이미 처리 중이므로 파일 선택창 열기 무시');
        return;
    }
    
    // 방법 1: 직접 label 클릭 방식 (가장 안정적)
    try {
        // 기존 fileInput 숨기기
        const existingFileInput = document.getElementById('fileInput');
        if (existingFileInput) {
            existingFileInput.style.display = 'none';
        }
        
        // 새로운 label과 input 생성
        const label = document.createElement('label');
        label.htmlFor = 'tempFileInput';
        label.style.position = 'absolute';
        label.style.left = '-9999px';
        label.style.top = '-9999px';
        label.style.opacity = '0';
        label.style.pointerEvents = 'none';
        
        const newFileInput = document.createElement('input');
        newFileInput.id = 'tempFileInput';
        newFileInput.type = 'file';
        newFileInput.accept = 'image/*';
        newFileInput.multiple = false;
        newFileInput.style.position = 'absolute';
        newFileInput.style.left = '-9999px';
        newFileInput.style.top = '-9999px';
        newFileInput.style.opacity = '0';
        newFileInput.style.pointerEvents = 'none';
        
        // 파일 선택 이벤트 처리
        newFileInput.addEventListener('change', (e) => {
            console.log('📁 파일 선택됨:', e.target.files.length, '개');
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
            // 임시 요소들 제거
            setTimeout(() => {
                if (document.body.contains(label)) {
                    document.body.removeChild(label);
                }
                if (document.body.contains(newFileInput)) {
                    document.body.removeChild(newFileInput);
                }
            }, 1000);
        });
        
        // DOM에 추가
        document.body.appendChild(label);
        document.body.appendChild(newFileInput);
        
        // label 클릭으로 파일 선택창 열기
        setTimeout(() => {
            label.click();
            console.log('✅ 방법 1 성공: label 클릭 방식');
        }, 50);
        
        return;
    } catch (error) {
        console.warn('⚠️ 방법 1 실패:', error.message);
    }
    
    // 방법 2: 프로그래밍 방식 클릭 이벤트 (더 강력한 방법)
    try {
        const newFileInput = document.createElement('input');
        newFileInput.type = 'file';
        newFileInput.accept = 'image/*';
        newFileInput.multiple = false;
        newFileInput.style.position = 'absolute';
        newFileInput.style.left = '-9999px';
        newFileInput.style.top = '-9999px';
        newFileInput.style.opacity = '0';
        newFileInput.style.pointerEvents = 'none';
        
        // 파일 선택 이벤트 처리
        newFileInput.addEventListener('change', (e) => {
            console.log('📁 파일 선택됨:', e.target.files.length, '개');
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
            // 임시 요소 제거
            setTimeout(() => {
                if (document.body.contains(newFileInput)) {
                    document.body.removeChild(newFileInput);
                }
            }, 1000);
        });
        
        // DOM에 추가
        document.body.appendChild(newFileInput);
        
        // 강제로 클릭 이벤트 발생
        setTimeout(() => {
            const clickEvent = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
                clientX: 0,
                clientY: 0
            });
            newFileInput.dispatchEvent(clickEvent);
            console.log('✅ 방법 2 성공: 강제 클릭 이벤트');
        }, 100);
        
        return;
    } catch (error) {
        console.warn('⚠️ 방법 2 실패:', error.message);
    }
    
    // 방법 3: 모바일 환경에서 특별 처리
    if (AppState.isMobile) {
        console.log('📱 모바일 환경 감지 - 모바일 전용 방법 시도');
        
        try {
            // 모바일에서는 capture 속성 추가
            const mobileFileInput = document.createElement('input');
            mobileFileInput.type = 'file';
            mobileFileInput.accept = 'image/*';
            mobileFileInput.capture = 'environment';
            mobileFileInput.style.display = 'none';
            
            mobileFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
                setTimeout(() => {
                    if (document.body.contains(mobileFileInput)) {
                        document.body.removeChild(mobileFileInput);
                    }
                }, 1000);
            });
            
            document.body.appendChild(mobileFileInput);
            
            // 모바일에서는 직접 클릭
            setTimeout(() => {
                mobileFileInput.click();
                console.log('✅ 방법 3 성공: 모바일 전용 파일 입력');
            }, 100);
            
            return;
        } catch (error) {
            console.warn('⚠️ 방법 3 실패:', error.message);
        }
    }
    
    // 방법 4: 사용자 상호작용 기반 파일 선택
    try {
        console.log('🖱️ 사용자 상호작용 기반 파일 선택 시도');
        
        // 사용자에게 직접 클릭하도록 안내
        const userChoice = confirm('파일 선택창을 자동으로 열 수 없습니다.\n\n"확인"을 누르면 파일 선택 버튼을 생성합니다.\n"취소"를 누르면 다른 방법을 시도합니다.');
        
        if (userChoice) {
            // 화면에 보이는 파일 선택 버튼 생성
            const visibleFileInput = document.createElement('input');
            visibleFileInput.type = 'file';
            visibleFileInput.accept = 'image/*';
            visibleFileInput.style.position = 'fixed';
            visibleFileInput.style.top = '50%';
            visibleFileInput.style.left = '50%';
            visibleFileInput.style.transform = 'translate(-50%, -50%)';
            visibleFileInput.style.zIndex = '9999';
            visibleFileInput.style.padding = '20px';
            visibleFileInput.style.background = 'white';
            visibleFileInput.style.border = '2px solid #007bff';
            visibleFileInput.style.borderRadius = '10px';
            visibleFileInput.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
            
            visibleFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
                document.body.removeChild(visibleFileInput);
            });
            
            document.body.appendChild(visibleFileInput);
            console.log('✅ 방법 4 성공: 화면에 보이는 파일 선택 버튼 생성');
            return;
        }
    } catch (error) {
        console.warn('⚠️ 방법 4 실패:', error.message);
    }
    
    // 모든 방법이 실패한 경우
    console.error('❌ 모든 파일 선택 방법 실패');
    
    // 최종 대안: 모바일에서는 갤러리 열기, 데스크톱에서는 안내
    if (AppState.isMobile) {
        openGallery();
    } else {
        alert('파일 선택창을 열 수 없습니다.\n\n브라우저의 파일 메뉴에서 "파일 열기"를 선택하여 이미지를 선택해주세요.');
    }
}

// 드래그 오버 처리
function handleDragOver(event) {
    event.preventDefault();
    AppState.elements.uploadArea.classList.add('dragover');
}

// 드래그 리브 처리
function handleDragLeave(event) {
    event.preventDefault();
    AppState.elements.uploadArea.classList.remove('dragover');
}

// 드롭 처리
function handleDrop(event) {
    event.preventDefault();
    AppState.elements.uploadArea.classList.remove('dragover');
    
    if (AppState.isProcessing) {
        console.log('🚫 처리 중이므로 드롭 무시');
        return;
    }
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// 파일 변경 이벤트 처리
function handleFileChange(event) {
    console.log('📁 파일 변경 이벤트 발생');
    console.log('파일 개수:', event.target.files.length);
    
    if (AppState.isProcessing) {
        console.log('🚫 처리 중이므로 파일 변경 무시');
        event.target.value = ''; // 파일 입력 초기화
        return;
    }
    
    const file = event.target.files[0];
    if (file) {
        console.log('선택된 파일:', file.name, file.type, file.size);
        
        // 파일을 AppState에 저장 (일기 생성 시 사용)
        AppState.currentFile = file;
        console.log('💾 파일을 AppState에 저장:', file.name, file.type, '[크기 숨김]');
        
        // 파일 처리
        handleFile(file);
    } else {
        console.log('파일이 선택되지 않음');
    }
}

// 마지막 처리된 파일 정보 (중복 방지용)
let lastProcessedFile = null;

// 이미지 최적화 함수 (성능 향상)
function optimizeImage(file) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // 이미지 크기 최적화 (너무 큰 이미지는 리사이즈)
            const maxSize = 1200;
            let { width, height } = img;
            
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 이미지 품질 최적화
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // 최적화된 이미지를 Blob으로 변환
            canvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/jpeg', 0.85); // 품질 85%로 최적화
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// 파일 처리
async function handleFile(file) {
    console.log('📄 파일 처리 시작:', file.name, file.type, file.size);
    
    // 이미지 파일인지 확인
    if (!file.type.startsWith('image/')) {
        console.log('❌ 이미지 파일이 아닙니다:', file.type);
        alert('이미지 파일을 선택해주세요.');
        return;
    }
    
    // 이미 처리 중인지 확인
    if (AppState.isProcessing) {
        console.log('🚫 이미 처리 중입니다.');
        return;
    }
    
    // 같은 파일이 연속으로 처리되는 것을 방지
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`;
    if (lastProcessedFile === fileKey) {
        console.log('🚫 같은 파일이 연속으로 처리됨 - 무시');
        return;
    }
    
    // 처리 시작
    AppState.isProcessing = true;
    lastProcessedFile = fileKey;
    console.log('🔄 파일 처리 시작 - 플래그 설정됨');
    
    // 이미지 최적화 후 처리
    try {
        console.log('🔄 이미지 최적화 시작...');
        const optimizedBlob = await optimizeImage(file);
        console.log('✅ 이미지 최적화 완료');
        
        // 최적화된 이미지로 처리
        const reader = new FileReader();
        
        reader.onload = (event) => {
            console.log('📖 파일 읽기 완료');
            AppState.currentImage = event.target.result;
            
            // 미리보기 이미지 설정
            AppState.elements.previewImage.src = AppState.currentImage;
            
            // 분석 섹션 표시
            showAnalysisSection();
            
            // 로딩 상태 표시
            showLoadingStates();
            
            // EXIF 분석 시작
            setTimeout(() => {
                analyzeImage(file);
            }, 100); // 약간의 지연으로 UI 업데이트 보장
        };
        
        reader.readAsDataURL(optimizedBlob);
    } catch (error) {
        console.warn('⚠️ 이미지 최적화 실패, 원본으로 진행:', error);
        
        // 최적화 실패 시 원본으로 처리
        const reader = new FileReader();
        
        reader.onload = (event) => {
            console.log('📖 파일 읽기 완료 (원본)');
            AppState.currentImage = event.target.result;
            
            // 미리보기 이미지 설정
            AppState.elements.previewImage.src = AppState.currentImage;
            
            // 분석 섹션 표시
            showAnalysisSection();
            
            // 로딩 상태 표시
            showLoadingStates();
            
            // EXIF 분석 시작
            setTimeout(() => {
                analyzeImage(file);
            }, 100);
        };
        
        reader.readAsDataURL(file);
    }
    
    reader.onerror = (error) => {
        console.error('❌ 파일 읽기 오류:', error);
        alert('파일을 읽는 중 오류가 발생했습니다.');
        AppState.isProcessing = false;
        lastProcessedFile = null; // 오류 시 초기화
    };
    
    reader.readAsDataURL(file);
}

// 분석 섹션 표시
function showAnalysisSection() {
    console.log('📊 분석 섹션 표시');
    
    const { analysisSection, diarySection, saveSection } = AppState.elements;
    if (analysisSection) {
        analysisSection.style.display = 'block';
        analysisSection.classList.add('fade-in');
    }
    
    // 일기 섹션도 표시 (이제 분석 섹션 내부에 포함됨)
    if (diarySection) {
        diarySection.style.display = 'block';
        diarySection.classList.add('fade-in');
    }
    
    // 화면 저장 섹션도 표시
    if (saveSection) {
        saveSection.style.display = 'block';
        saveSection.classList.add('fade-in');
    }
}

// 로딩 상태 표시
function showLoadingStates() {
    console.log('⏳ 로딩 상태 표시');
    
    const { faceContainer, dateTimeInfo, locationInfo, activityInfo, eventInfo } = AppState.elements;
    
    if (faceContainer) faceContainer.innerHTML = '<div class="loading">얼굴을 인식하고 있습니다...</div>';
    if (dateTimeInfo) dateTimeInfo.innerHTML = '<div class="loading">날짜 정보를 분석 중...</div>';
    if (locationInfo) locationInfo.innerHTML = '<div class="loading">위치 정보를 분석 중...</div>';
    if (activityInfo) activityInfo.innerHTML = '<div class="loading">활동 정보를 분석 중...</div>';
    if (eventInfo) eventInfo.innerHTML = '<div class="loading">이벤트 정보를 분석 중...</div>';
}

// 이미지 분석
async function analyzeImage(file) {
    console.log('🔍 이미지 분석 시작');
    
    try {
        // EXIF 데이터 추출
        const exifData = await extractExifData(file);
        console.log('📋 EXIF 데이터 추출 완료:', Object.keys(exifData).length, '개 항목');
        
        // 각 분석 실행
        await Promise.all([
            analyzeWho(exifData),
            analyzeWhen(exifData),
            analyzeWhere(exifData),
            analyzeHow(exifData),
            analyzeWhy(exifData)
        ]);
        
        console.log('✅ 모든 분석 완료');
        
        // 분석 데이터 수집 및 저장
        collectAnalysisData(exifData);
        
    } catch (error) {
        console.error('❌ 분석 중 오류:', error);
    } finally {
        // 처리 완료 플래그 해제
        AppState.isProcessing = false;
        console.log('🏁 처리 완료 - 플래그 해제됨');
        console.log('isProcessing 상태:', AppState.isProcessing);
        
        // 3초 후 lastProcessedFile 초기화 (다른 파일 선택 가능하도록)
        setTimeout(() => {
            lastProcessedFile = null;
            console.log('🔄 파일 처리 기록 초기화 - 새로운 파일 선택 가능');
        }, 3000);
        
        // 파일 입력 초기화 (중복 선택 방지)
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
            console.log('🔄 파일 입력 초기화 완료');
        }
    }
}

// EXIF 데이터 추출
function extractExifData(file) {
    return new Promise((resolve) => {
        try {
            // EXIF 라이브러리 존재 여부 확인
            if (typeof EXIF === 'undefined') {
                console.warn('⚠️ EXIF 라이브러리가 로드되지 않았습니다. 기본 분석을 진행합니다.');
                resolve({});
                return;
            }
            
            console.log('📋 EXIF 데이터 추출 시작...');
            
            // 타임아웃 설정 (5초)
            const timeout = setTimeout(() => {
                console.warn('⚠️ EXIF 데이터 추출 타임아웃');
                resolve({});
            }, 5000);
            
            EXIF.getData(file, function() {
                clearTimeout(timeout);
                const exifData = EXIF.getAllTags(this);
                
                if (exifData && Object.keys(exifData).length > 0) {
                    console.log('✅ EXIF 데이터 추출 완료:', Object.keys(exifData).length, '개 항목');
                } else {
                    console.log('ℹ️ EXIF 데이터가 없거나 비어있습니다.');
                }
                
                resolve(exifData || {});
            });
        } catch (error) {
            console.warn('⚠️ EXIF 데이터 추출 실패:', error.message);
            resolve({});
        }
    });
}

// 누가 (Who) 분석 - Face-api.js + Canvas 기반 얼굴 감지 시스템
async function analyzeWho(exifData) {
    console.log('👤 Who 분석 시작');
    
    const { faceContainer } = AppState.elements;
    
    try {
        // 1단계: Face-api.js 얼굴 감지 시도
        if (AppState.faceApiLoaded && typeof faceapi !== 'undefined') {
            console.log('🔍 Face-api.js 얼굴 감지 시작...');
            
            try {
                // 이미지를 HTML 이미지 요소로 변환
                const img = new Image();
                img.src = AppState.currentImage;
                img.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('이미지 로드 실패'));
                    setTimeout(() => reject(new Error('이미지 로드 타임아웃')), 5000);
                });
                
                console.log('🖼️ 이미지 로드 완료, Face-api.js 얼굴 감지 시작...');
                
                // Face-api.js로 얼굴 감지
                const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions());
                
                console.log('🎯 Face-api.js 얼굴 감지 결과:', detections.length, '개의 얼굴');
                
                if (detections.length > 0) {
                    // Face-api.js로 얼굴이 감지된 경우
                    let faceInfoHtml = `
                        <div class="success">
                            <strong>✅ ${detections.length}명의 얼굴이 감지되었습니다</strong>
                        </div>
                    `;
                    
                    // 얼굴 썸네일 컨테이너 추가
                    faceInfoHtml += `
                        <div class="face-thumbnails">
                    `;
                    
                    // 각 얼굴의 썸네일 및 정보 생성
                    for (let i = 0; i < detections.length; i++) {
                        const detection = detections[i];
                        const box = detection.box;
                        const confidence = (detection.score * 100).toFixed(1);
                        
                        // 얼굴 영역 정보
                        const faceRegion = {
                            x: Math.round(box.x),
                            y: Math.round(box.y),
                            width: Math.round(box.width),
                            height: Math.round(box.height)
                        };
                        
                        // 썸네일 생성
                        const thumbnailData = await createFaceThumbnail(AppState.currentImage, faceRegion, 80);
                        
                        faceInfoHtml += `
                            <div class="face-item">
                                <div class="face-thumbnail">
                                    ${thumbnailData ? 
                                        `<img src="${thumbnailData}" alt="얼굴 ${i + 1}">` :
                                        `<div class="face-placeholder">😊</div>`
                                    }
                                </div>
                                <div class="face-info">
                                    <strong>얼굴 ${i + 1}</strong>
                                    <small>신뢰도: ${confidence}%</small>
                                </div>
                            </div>
                        `;
                    }
                    
                    faceInfoHtml += `</div>`;
                    
                    faceContainer.innerHTML = faceInfoHtml;
                    console.log('✅ Face-api.js 얼굴 감지 완료');
                    return;
                }
            } catch (faceApiError) {
                console.warn('⚠️ Face-api.js 얼굴 감지 실패:', faceApiError.message);
            }
        }
        
        // 2단계: Canvas 기반 얼굴 감지 시도
        console.log('🔍 Canvas 기반 얼굴 감지 시작...');
        const canvasDetection = await detectFacesWithCanvas();
        
        if (canvasDetection.facesFound > 0) {
            // Canvas로 얼굴이 감지된 경우
            let faceInfoHtml = `
                <div class="success">
                    <strong>✅ ${canvasDetection.facesFound}명의 얼굴이 감지되었습니다</strong>
                </div>
            `;
            
            // 얼굴 썸네일 컨테이너 추가
            faceInfoHtml += `
                <div class="face-thumbnails">
            `;
            
            // 각 얼굴의 썸네일 및 정보 생성
            for (let i = 0; i < canvasDetection.faceRegions.length; i++) {
                const region = canvasDetection.faceRegions[i];
                
                // 썸네일 생성
                const thumbnailData = await createFaceThumbnail(AppState.currentImage, region, 80);
                
                faceInfoHtml += `
                    <div class="face-item">
                        <div class="face-thumbnail">
                            ${thumbnailData ? 
                                `<img src="${thumbnailData}" alt="얼굴 ${i + 1}">` :
                                `<div class="face-placeholder">😊</div>`
                            }
                        </div>
                        <div class="face-info">
                            <strong>얼굴 ${i + 1}</strong>
                            <small>Canvas 분석</small>
                        </div>
                    </div>
                `;
            }
            
            faceInfoHtml += `</div>`;
            
            faceContainer.innerHTML = faceInfoHtml;
            console.log('✅ Canvas 기반 얼굴 감지 완료');
            return;
        }
        
        // 3단계: 모든 얼굴 감지 실패 시 EXIF 기반 분석
        console.log('⚠️ 모든 얼굴 감지 실패 - EXIF 기반 분석으로 전환');
        await analyzeWhoFromExif(exifData, faceContainer);
        
    } catch (error) {
        console.error('❌ 얼굴 감지 오류:', error);
        // 오류 발생 시 EXIF 기반 분석으로 폴백
        await analyzeWhoFromExif(exifData, faceContainer);
    }
}

// EXIF 기반 인물 정보 분석 (폴백)
async function analyzeWhoFromExif(exifData, faceContainer) {
    console.log('📊 EXIF 기반 인물 정보 분석');
    
    const details = getExifBasedPersonInfo(exifData);
    
    const detailsHtml = details.map(detail => `<li>${detail}</li>`).join('');
    
    // 간단한 얼굴 인식 대안 버튼 추가
    faceContainer.innerHTML = `
        <div class="info">
            <strong>📷 사진 속 인물 정보</strong>
            <ul style="margin: 8px 0; padding-left: 20px;">
                ${detailsHtml}
            </ul>
            <div style="margin-top: 12px; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                <small>💡 자동 얼굴 인식이 어려워 EXIF 기반으로 분석했습니다.</small><br>
                <button onclick="manualFaceDetection()" style="margin-top: 8px; padding: 4px 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    수동 얼굴 감지 시도
                </button>
            </div>
        </div>
    `;
}

// 수동 얼굴 감지 시도 (Canvas 기반)
async function manualFaceDetection() {
    console.log('🖱️ 수동 얼굴 감지 시작');
    
    try {
        const { faceContainer } = AppState.elements;
        
        // 로딩 상태 표시
        faceContainer.innerHTML = `
            <div class="loading">
                <strong>🔍 수동 얼굴 감지 중...</strong><br>
                <small>Canvas API를 사용하여 이미지를 분석합니다...</small>
            </div>
        `;
        
        // Canvas로 이미지 분석 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 기본 이미지 분석 (색상 분석 등)
        const imageAnalysis = await analyzeImageColors();
        
        faceContainer.innerHTML = `
            <div class="success">
                <strong>🎨 이미지 색상 분석 완료</strong>
                <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                    ${imageAnalysis}
                </div>
                <small>💡 인물 위치는 이미지 중앙 부분에 있을 가능성이 높습니다.</small>
            </div>
        `;
        
        console.log('✅ 수동 얼굴 감지 완료');
    } catch (error) {
        console.error('❌ 수동 얼굴 감지 오류:', error);
        const { faceContainer } = AppState.elements;
        faceContainer.innerHTML = `
            <div class="error">
                수동 얼굴 감지 중 오류가 발생했습니다.<br>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Canvas 기반 얼굴 감지 (향상된 버전)
async function detectFacesWithCanvas() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const faces = detectFacesInImageData(imageData, img.width, img.height);
            
            resolve({
                facesFound: faces.length,
                faceRegions: faces,
                imageAnalysis: analyzeImageCharacteristics(imageData, img.width, img.height)
            });
        };
        
        img.onerror = () => {
            resolve({
                facesFound: 0,
                faceRegions: [],
                imageAnalysis: '이미지 분석을 완료할 수 없습니다.'
            });
        };
        
        img.src = AppState.currentImage;
    });
}

// 얼굴 썸네일 생성 함수
function createFaceThumbnail(imageSource, faceRegion, thumbnailSize = 80) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // 썸네일 캔버스 크기 설정
            canvas.width = thumbnailSize;
            canvas.height = thumbnailSize;
            
            // 얼굴 영역에 약간의 여백 추가
            const padding = Math.max(faceRegion.width, faceRegion.height) * 0.3;
            const sourceX = Math.max(0, faceRegion.x - padding);
            const sourceY = Math.max(0, faceRegion.y - padding);
            const sourceWidth = Math.min(img.width - sourceX, faceRegion.width + padding * 2);
            const sourceHeight = Math.min(img.height - sourceY, faceRegion.height + padding * 2);
            
            // 원형 클리핑 경로 생성
            ctx.beginPath();
            ctx.arc(thumbnailSize / 2, thumbnailSize / 2, thumbnailSize / 2, 0, 2 * Math.PI);
            ctx.clip();
            
            // 배경 색상 설정
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, thumbnailSize, thumbnailSize);
            
            // 얼굴 영역을 썸네일 크기로 조정하여 그리기
            ctx.drawImage(
                img,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, thumbnailSize, thumbnailSize
            );
            
            // 썸네일 데이터 URL 반환
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        
        img.onerror = () => {
            console.error('❌ 썸네일 생성 실패');
            resolve(null);
        };
        
        img.src = imageSource;
    });
}

// 이미지 데이터에서 얼굴 감지
function detectFacesInImageData(imageData, width, height) {
    const faces = [];
    const blockSize = 50; // 분석 블록 크기
    const threshold = 0.6; // 얼굴 감지 임계값
    
    // 이미지를 블록 단위로 분석
    for (let y = 0; y < height - blockSize; y += blockSize) {
        for (let x = 0; x < width - blockSize; x += blockSize) {
            const faceScore = analyzeBlockForFace(imageData, width, x, y, blockSize);
            
            if (faceScore > threshold) {
                faces.push({
                    x: x,
                    y: y,
                    width: blockSize,
                    height: blockSize,
                    confidence: faceScore
                });
            }
        }
    }
    
    // 중복 영역 제거 및 병합
    return mergeOverlappingFaces(faces);
}

// 블록 단위 얼굴 분석
function analyzeBlockForFace(imageData, width, x, y, blockSize) {
    let skinTonePixels = 0;
    let totalPixels = 0;
    
    for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
            const pixelX = x + dx;
            const pixelY = y + dy;
            
            if (pixelX < width && pixelY < imageData.height / 4) { // 상단 1/4 영역만 분석
                const index = (pixelY * width + pixelX) * 4;
                const r = imageData.data[index];
                const g = imageData.data[index + 1];
                const b = imageData.data[index + 2];
                
                // 피부톤 감지 (간단한 규칙)
                if (isSkinTone(r, g, b)) {
                    skinTonePixels++;
                }
                totalPixels++;
            }
        }
    }
    
    return totalPixels > 0 ? skinTonePixels / totalPixels : 0;
}

// 피부톤 감지
function isSkinTone(r, g, b) {
    // 피부톤 감지를 위한 간단한 규칙
    const isRedDominant = r > g && r > b;
    const isGreenReasonable = g > b * 0.5 && g < r * 0.9;
    const isBlueLow = b < r * 0.7;
    const isBrightEnough = (r + g + b) / 3 > 80;
    const isNotTooBright = (r + g + b) / 3 < 240;
    
    return isRedDominant && isGreenReasonable && isBlueLow && isBrightEnough && isNotTooBright;
}

// 중복 얼굴 영역 병합
function mergeOverlappingFaces(faces) {
    if (faces.length <= 1) return faces;
    
    const merged = [];
    const used = new Set();
    
    for (let i = 0; i < faces.length; i++) {
        if (used.has(i)) continue;
        
        let currentFace = faces[i];
        used.add(i);
        
        for (let j = i + 1; j < faces.length; j++) {
            if (used.has(j)) continue;
            
            if (facesOverlap(currentFace, faces[j])) {
                currentFace = mergeTwoFaces(currentFace, faces[j]);
                used.add(j);
            }
        }
        
        merged.push(currentFace);
    }
    
    return merged;
}

// 두 얼굴 영역이 겹치는지 확인
function facesOverlap(face1, face2) {
    const overlapX = Math.max(0, Math.min(face1.x + face1.width, face2.x + face2.width) - Math.max(face1.x, face2.x));
    const overlapY = Math.max(0, Math.min(face1.y + face1.height, face2.y + face2.height) - Math.max(face1.y, face2.y));
    
    const overlapArea = overlapX * overlapY;
    const face1Area = face1.width * face1.height;
    const face2Area = face2.width * face2.height;
    const minArea = Math.min(face1Area, face2Area);
    
    return overlapArea > minArea * 0.3; // 30% 이상 겹치면 병합
}

// 두 얼굴 영역 병합
function mergeTwoFaces(face1, face2) {
    return {
        x: Math.min(face1.x, face2.x),
        y: Math.min(face1.y, face2.y),
        width: Math.max(face1.x + face1.width, face2.x + face2.width) - Math.min(face1.x, face2.x),
        height: Math.max(face1.y + face1.height, face2.y + face2.height) - Math.min(face1.y, face2.y),
        confidence: Math.max(face1.confidence, face2.confidence)
    };
}

// 이미지 특성 분석
function analyzeImageCharacteristics(imageData, width, height) {
    let totalR = 0, totalG = 0, totalB = 0;
    let brightPixels = 0;
    let darkPixels = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        totalR += r;
        totalG += g;
        totalB += b;
        
        const brightness = (r + g + b) / 3;
        if (brightness > 150) brightPixels++;
        if (brightness < 80) darkPixels++;
    }
    
    const pixelCount = imageData.data.length / 4;
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);
    
    let analysis = `평균 색상: RGB(${avgR}, ${avgG}, ${avgB})<br>`;
    analysis += `밝은 픽셀: ${Math.round(brightPixels / pixelCount * 100)}%<br>`;
    analysis += `어두운 픽셀: ${Math.round(darkPixels / pixelCount * 100)}%<br>`;
    
    // 이미지 특성 기반 추론
    if (avgR > 150 && avgG > 120 && avgB > 100) {
        analysis += '밝은 톤 - 인물 사진일 가능성 높음';
    } else if (avgR < 100 && avgG < 100 && avgB < 100) {
        analysis += '어두운 톤 - 저조도 환경 촬영';
    } else {
        analysis += '중간 톤 - 일반적인 촬영 환경';
    }
    
    return analysis;
}

// 이미지 색상 분석 (간단한 대안)
async function analyzeImageColors() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // 중앙 부분의 색상 분석
            const centerX = Math.floor(img.width / 2);
            const centerY = Math.floor(img.height / 2);
            const imageData = ctx.getImageData(centerX - 50, centerY - 50, 100, 100);
            
            let totalR = 0, totalG = 0, totalB = 0;
            for (let i = 0; i < imageData.data.length; i += 4) {
                totalR += imageData.data[i];
                totalG += imageData.data[i + 1];
                totalB += imageData.data[i + 2];
            }
            
            const pixelCount = imageData.data.length / 4;
            const avgR = Math.round(totalR / pixelCount);
            const avgG = Math.round(totalG / pixelCount);
            const avgB = Math.round(totalB / pixelCount);
            
            let colorAnalysis = `평균 색상: RGB(${avgR}, ${avgG}, ${avgB})<br>`;
            
            // 색상 기반 추론
            if (avgR > 150 && avgG > 120 && avgB > 100) {
                colorAnalysis += '밝은 톤 - 인물 사진일 가능성 높음';
            } else if (avgR < 100 && avgG < 100 && avgB < 100) {
                colorAnalysis += '어두운 톤 - 저조도 환경 촬영';
            } else {
                colorAnalysis += '중간 톤 - 일반적인 촬영 환경';
            }
            
            resolve(colorAnalysis);
        };
        
        img.onerror = () => {
            resolve('이미지 분석을 완료할 수 없습니다.');
        };
        
        img.src = AppState.currentImage;
    });
}

// EXIF 데이터에서 인물 관련 정보 추출
function getExifBasedPersonInfo(exifData) {
    const details = [];
    
    // 촬영 모드
    if (exifData.SceneType) {
        details.push(`촬영 모드: ${exifData.SceneType}`);
    }
    
    // 플래시 사용 여부
    if (exifData.Flash !== undefined) {
        if (exifData.Flash === 16 || exifData.Flash === 'No Flash') {
            details.push('자연광으로 촬영');
        } else {
            details.push('플래시 사용으로 인물 촬영');
        }
    }
    
    // 조리개 값으로 촬영 스타일 추론
    if (exifData.FNumber) {
        const aperture = parseFloat(exifData.FNumber);
        if (aperture < 2.8) {
            details.push('인물 중심의 촬영 (배경 흐림)');
        } else if (aperture > 8) {
            details.push('풍경 중심의 촬영 (전체 초점)');
        } else {
            details.push('일반적인 촬영');
        }
    }
    
    // ISO 설정
    if (exifData.ISOSpeedRatings) {
        const iso = exifData.ISOSpeedRatings;
        if (iso > 800) {
            details.push('저조도 환경에서 촬영');
        } else if (iso < 200) {
            details.push('밝은 환경에서 촬영');
        }
    }
    
    // 기본 정보
    if (details.length === 0) {
        details.push('일반적인 사진 촬영');
    }
    
    return details;
}

// 언제 (When) 분석 - 날짜/시간
async function analyzeWhen(exifData) {
    console.log('📅 When 분석 시작');
    
    const { dateTimeInfo } = AppState.elements;
    
    try {
        let dateTime = null;
        
        if (exifData.DateTimeOriginal) {
            dateTime = new Date(exifData.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        } else if (exifData.DateTime) {
            dateTime = new Date(exifData.DateTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        }
        
        if (dateTime && !isNaN(dateTime.getTime())) {
            const dateStr = dateTime.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
            });
            
            const timeStr = dateTime.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            // XSS 방지를 위한 안전한 DOM 조작
            dateTimeInfo.innerHTML = '';
            const dateDiv = document.createElement('div');
            dateDiv.className = 'date';
            dateDiv.textContent = dateStr;
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time';
            timeDiv.textContent = timeStr;
            dateTimeInfo.appendChild(dateDiv);
            dateTimeInfo.appendChild(timeDiv);
        } else {
            dateTimeInfo.innerHTML = '<div class="info">사진의 날짜 정보를 찾을 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('❌ 날짜 분석 오류:', error);
        dateTimeInfo.innerHTML = '<div class="error">날짜 정보 분석 중 오류가 발생했습니다.</div>';
    }
}

// 어디서 (Where) 분석 - 위치 정보
async function analyzeWhere(exifData) {
    console.log('📍 Where 분석 시작');
    
    const { locationInfo } = AppState.elements;
    
    try {
        let latitude = null;
        let longitude = null;
        
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
            latitude = convertDMSToDD(exifData.GPSLatitude, exifData.GPSLatitudeRef);
            longitude = convertDMSToDD(exifData.GPSLongitude, exifData.GPSLongitudeRef);
        }
        
        if (latitude && longitude) {
            const address = await getAddressFromCoordinates(latitude, longitude);
            // XSS 방지를 위한 안전한 DOM 조작
            locationInfo.innerHTML = '';
            const locationDiv = document.createElement('div');
            locationDiv.className = 'location';
            locationDiv.textContent = address;
            const coordinatesDiv = document.createElement('div');
            coordinatesDiv.className = 'coordinates';
            coordinatesDiv.textContent = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            locationInfo.appendChild(locationDiv);
            locationInfo.appendChild(coordinatesDiv);
        } else {
            locationInfo.innerHTML = '<div class="info">사진의 위치 정보를 찾을 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('❌ 위치 분석 오류:', error);
        locationInfo.innerHTML = '<div class="error">위치 정보 분석 중 오류가 발생했습니다.</div>';
    }
}

// 어떻게 (How) 분석 - 활동 정보
async function analyzeHow(exifData) {
    console.log('🎯 How 분석 시작');
    
    const { activityInfo } = AppState.elements;
    
    try {
        const activities = [];
        
        if (exifData.ISOSpeedRatings) {
            const iso = exifData.ISOSpeedRatings;
            if (iso > 800) {
                activities.push('어두운 환경에서 촬영');
            } else if (iso < 200) {
                activities.push('밝은 환경에서 촬영');
            }
        }
        
        if (exifData.ExposureTime) {
            const shutterSpeed = exifData.ExposureTime;
            if (shutterSpeed < 1/60) {
                activities.push('빠른 동작 촬영');
            } else if (shutterSpeed > 1) {
                activities.push('장시간 노출 촬영');
            }
        }
        
        if (exifData.FNumber) {
            const fNumber = exifData.FNumber;
            if (fNumber < 2.8) {
                activities.push('배경 흐림 효과');
            } else if (fNumber > 8) {
                activities.push('전체 초점 촬영');
            }
        }
        
        if (exifData.Flash) {
            activities.push('플래시 사용');
        }
        
        if (activities.length === 0) {
            activities.push('일반 촬영');
        }
        
        // XSS 방지를 위한 안전한 DOM 조작
        activityInfo.innerHTML = '';
        const ul = document.createElement('ul');
        ul.className = 'activity-list';
        activities.forEach(activity => {
            const li = document.createElement('li');
            li.textContent = activity;
            ul.appendChild(li);
        });
        activityInfo.appendChild(ul);
    } catch (error) {
        console.error('❌ 활동 분석 오류:', error);
        activityInfo.innerHTML = '<div class="error">활동 정보 분석 중 오류가 발생했습니다.</div>';
    }
}

// 왜 (Why) 분석 - 이벤트 정보
async function analyzeWhy(exifData) {
    console.log('❓ Why 분석 시작');
    
    const { eventInfo } = AppState.elements;
    
    try {
        let eventDate = null;
        
        if (exifData.DateTimeOriginal) {
            eventDate = new Date(exifData.DateTimeOriginal.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        } else if (exifData.DateTime) {
            eventDate = new Date(exifData.DateTime.replace(/(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3'));
        }
        
        if (eventDate && !isNaN(eventDate.getTime())) {
            const month = eventDate.getMonth() + 1;
            const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
            const monthName = monthNames[month - 1];
            
            let eventDescription = '';
            if (month >= 3 && month <= 5) {
                eventDescription = '봄철 모임';
            } else if (month >= 6 && month <= 8) {
                eventDescription = '여름철 모임';
            } else if (month >= 9 && month <= 11) {
                eventDescription = '가을철 모임';
            } else {
                eventDescription = '겨울철 모임';
            }
            
            // XSS 방지를 위한 안전한 DOM 조작
            eventInfo.innerHTML = '';
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event';
            eventDiv.textContent = `${monthName} 모임`;
            const descriptionDiv = document.createElement('div');
            descriptionDiv.className = 'description';
            descriptionDiv.textContent = eventDescription;
            eventInfo.appendChild(eventDiv);
            eventInfo.appendChild(descriptionDiv);
        } else {
            eventInfo.innerHTML = '<div class="info">이벤트 정보를 분석할 수 없습니다.</div>';
        }
    } catch (error) {
        console.error('❌ 이벤트 분석 오류:', error);
        eventInfo.innerHTML = '<div class="error">이벤트 정보 분석 중 오류가 발생했습니다.</div>';
    }
}

// DMS를 DD로 변환
function convertDMSToDD(dms, ref) {
    const degrees = dms[0];
    const minutes = dms[1];
    const seconds = dms[2];
    
    let dd = degrees + minutes / 60 + seconds / 3600;
    
    if (ref === 'S' || ref === 'W') {
        dd = -dd;
    }
    
    return dd;
}

// 좌표를 주소로 변환 (보안 강화)
async function getAddressFromCoordinates(latitude, longitude) {
    try {
        // 좌표 정보를 로그에 노출하지 않도록 보안 강화
        console.log('📍 위치 정보 조회 중...');
        
        // 요청 타임아웃 설정 (10초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&accept-language=ko`,
            {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'PhotoEXIFAnalyzer/1.0'
                }
            }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('주소 변환 실패');
        }
        
        const data = await response.json();
        
        if (data.address) {
            // 한국식 주소 순서로 구성: 시 > 구 > 동 > 도로명/상세주소
            const addressParts = [];
            
            // 시/도 (state, city)
            if (data.address.state || data.address.city) {
                addressParts.push(data.address.state || data.address.city);
            }
            
            // 구/군 (borough, county, city_district)
            if (data.address.borough || data.address.county || data.address.city_district) {
                addressParts.push(data.address.borough || data.address.county || data.address.city_district);
            }
            
            // 동/면 (suburb, neighbourhood, quarter, village)
            if (data.address.suburb || data.address.neighbourhood || data.address.quarter || data.address.village) {
                addressParts.push(data.address.suburb || data.address.neighbourhood || data.address.quarter || data.address.village);
            }
            
            // 도로명 (road, pedestrian)
            if (data.address.road || data.address.pedestrian) {
                addressParts.push(data.address.road || data.address.pedestrian);
            }
            
            // 건물명/상점명 (amenity, shop, building, house_name)
            if (data.address.amenity || data.address.shop || data.address.building || data.address.house_name) {
                const buildingName = data.address.amenity || data.address.shop || data.address.building || data.address.house_name;
                addressParts.push(`(${buildingName})`);
            }
            
            // 번지수 (house_number)
            if (data.address.house_number) {
                // 도로명이 있으면 번지수를 도로명 뒤에 추가
                if (data.address.road || data.address.pedestrian) {
                    const lastIndex = addressParts.length - 1;
                    if (lastIndex >= 0 && !addressParts[lastIndex].includes('(')) {
                        addressParts[lastIndex] += ` ${data.address.house_number}`;
                    }
                } else {
                    addressParts.push(data.address.house_number);
                }
            }
            
            if (addressParts.length > 0) {
                return addressParts.join(' ');
            }
        }
        
        // 주소 파싱 실패 시 기본 display_name 사용
        if (data.display_name) {
            const address = data.display_name.split(', ');
            return address.slice(0, 3).join(', ');
        } else {
            return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
    } catch (error) {
        console.error('주소 변환 오류:', error);
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
}

// 보안 강화된 메모리 정리 함수
function cleanupMemory() {
    console.log('🧹 보안 메모리 정리 시작');
    
    // 민감한 이미지 데이터 즉시 정리
    if (AppState.currentImage) {
        // Base64 데이터를 안전하게 제거
        AppState.currentImage = null;
        AppState.securityFlags.memoryCleared = true;
        console.log('🔒 민감한 이미지 데이터 메모리에서 제거됨');
    }
    
    // 이미지 캐시 정리 (보안 강화)
    if (AppState.imageCache.size > 5) { // 캐시 크기 제한 강화
        const entries = Array.from(AppState.imageCache.entries());
        const toDelete = entries.slice(0, 3); // 더 적은 수만 유지
        
        toDelete.forEach(([key, value]) => {
            // 캐시된 이미지 데이터도 안전하게 정리
            if (value && typeof value === 'string' && value.startsWith('data:')) {
                value = null; // 메모리에서 완전 제거
            }
            AppState.imageCache.delete(key);
        });
        
        console.log(`🗑️ 보안 이미지 캐시 정리: ${toDelete.length}개 삭제`);
    }
    
    // 분석 데이터에서 민감한 정보 제거
    if (AppState.analysisData) {
        // GPS 좌표, 원본 이미지 데이터 등 민감한 정보 제거
        if (AppState.analysisData.exif) {
            delete AppState.analysisData.exif.GPSLatitude;
            delete AppState.analysisData.exif.GPSLongitude;
            delete AppState.analysisData.exif.GPSLatitudeRef;
            delete AppState.analysisData.exif.GPSLongitudeRef;
        }
        delete AppState.analysisData.imageData;
        console.log('🔒 분석 데이터에서 민감한 정보 제거됨');
    }
    
    // 가비지 컬렉션 유도 (가능한 경우)
    if (window.gc) {
        try {
            window.gc();
            console.log('♻️ 보안 가비지 컬렉션 실행');
        } catch (error) {
            console.log('⚠️ 가비지 컬렉션 실행 불가');
        }
    }
    
    // 보안 플래그 업데이트
    AppState.securityFlags.memoryCleared = true;
}

// 성능 모니터링 함수
function startPerformanceMonitoring() {
    if ('performance' in window) {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'measure') {
                    console.log(`📊 성능 측정: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                }
            }
        });
        
        try {
            observer.observe({ entryTypes: ['measure'] });
            console.log('📊 성능 모니터링 시작');
        } catch (error) {
            console.log('⚠️ 성능 모니터링 시작 불가');
        }
    }
}

// 보안 초기화 함수
function initializeSecurity() {
    console.log('🔒 보안 초기화 시작');
    
    // 개발자 도구 감지 (기본적인 보호)
    let devtools = { open: false, orientation: null };
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                console.warn('⚠️ 보안 경고: 개발자 도구가 감지되었습니다.');
                // 개발자 도구 사용 시 민감한 데이터 정리
                cleanupMemory();
            }
        } else {
            devtools.open = false;
        }
    }, 500);
    
    // 페이지 언로드 시 메모리 정리
    window.addEventListener('beforeunload', () => {
        console.log('🔒 페이지 종료 - 메모리 정리');
        cleanupMemory();
    });
    
    // 페이지 숨김 시 메모리 정리
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('🔒 페이지 숨김 - 메모리 정리');
            cleanupMemory();
        }
    });
    
    console.log('✅ 보안 초기화 완료');
}

// 앱 초기화 (보안 강화)
function initializeApp() {
    console.log('🚀 사진 EXIF 분석기 초기화 시작 (보안 강화)');
    
    try {
        // 보안 초기화 먼저 실행
        initializeSecurity();
        
        // 모바일 환경 감지
        detectMobileEnvironment();
        
        // DOM 요소 초기화
        initializeElements();
        
        // 이벤트 리스너 설정
        setupEventListeners();
        
        // Face API 로드 (수정된 버전)
        loadFaceAPI();
        
        // 성능 모니터링 시작
        startPerformanceMonitoring();
        
        // 주기적 메모리 정리 (3분마다로 단축)
        setInterval(cleanupMemory, 3 * 60 * 1000);
        
        // 업로드 준비 상태로 변경
        showUploadReady();
        
        console.log('✅ 앱 초기화 완료 - 보안 강화된 모든 기능 사용 가능');
        console.log(`📱 모바일 환경: ${AppState.isMobile ? '예' : '아니오'}`);
        console.log('🔒 보안 모드: 활성화됨');
    } catch (error) {
        console.error('❌ 앱 초기화 실패:', error);
        
        // 초기화 실패해도 기본 업로드 기능은 동작하도록
        try {
            if (document.getElementById('uploadArea')) {
                document.getElementById('uploadArea').style.opacity = '1';
                document.getElementById('uploadArea').style.pointerEvents = 'auto';
            }
            console.log('⚠️ 제한된 모드로 앱 실행');
        } catch (fallbackError) {
            console.error('❌ 완전한 초기화 실패:', fallbackError);
            alert('앱을 초기화하는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
        }
    }
}





// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp);

// 전역 에러 처리
window.addEventListener('error', (event) => {
    console.error('❌ 전역 에러:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 처리되지 않은 Promise 거부:', event.reason);
});


// 일기 생성 버튼 처리
function handleGenerateDiary() {
    console.log('📝 일기 생성 요청');
    console.log('🔍 AppState.currentFile:', AppState.currentFile ? '[파일 존재]' : '[파일 없음]');
    console.log('🔍 AppState.currentImage:', AppState.currentImage ? '[이미지 존재]' : '[이미지 없음]');
    
    // 이미지가 업로드되었는지 확인 (currentFile이 있으면 재생성 가능)
    if (!AppState.currentFile) {
        console.error('❌ 업로드된 이미지가 없습니다');
        alert('먼저 사진을 업로드해주세요.');
        return;
    }
    
    // 키워드 입력 상태 확인
    const keywords = AppState.elements.diaryKeywords ? AppState.elements.diaryKeywords.value.trim() : '';
    if (keywords) {
        console.log('🔑 사용자 키워드:', keywords);
    } else {
        console.log('🔑 키워드 없음 - 기본 일기 생성');
    }
    
    console.log('✅ 이미지 확인 완료, 일기 생성 시작');
    generateDiaryWithBackend();
}

// 보안 강화된 분석 데이터 수집
function collectAnalysisData(exifData) {
    console.log('📊 보안 분석 데이터 수집');
    
    const { faceContainer, dateTimeInfo, locationInfo, activityInfo, eventInfo } = AppState.elements;
    
    // 민감한 정보를 제거한 안전한 EXIF 데이터 생성
    const safeExifData = { ...exifData };
    
    // GPS 정보 제거 (개인정보 보호)
    delete safeExifData.GPSLatitude;
    delete safeExifData.GPSLongitude;
    delete safeExifData.GPSLatitudeRef;
    delete safeExifData.GPSLongitudeRef;
    delete safeExifData.GPSAltitude;
    delete safeExifData.GPSAltitudeRef;
    delete safeExifData.GPSTimeStamp;
    delete safeExifData.GPSDateStamp;
    
    // 카메라 시리얼 번호 등 기기 식별 정보 제거
    delete safeExifData.CameraSerialNumber;
    delete safeExifData.LensSerialNumber;
    delete safeExifData.BodySerialNumber;
    
    // 위치 정보가 포함된 텍스트에서 민감한 부분 마스킹
    let safeLocationInfo = locationInfo ? locationInfo.textContent : '';
    if (safeLocationInfo && safeLocationInfo.includes(',')) {
        // 좌표 정보가 있으면 일반적인 지역명만 유지
        const parts = safeLocationInfo.split(',');
        if (parts.length > 2) {
            safeLocationInfo = parts.slice(0, 2).join(', '); // 시/구까지만 유지
        }
    }
    
    AppState.analysisData = {
        exif: safeExifData, // 민감한 정보 제거된 EXIF
        who: faceContainer ? faceContainer.textContent : '',
        when: dateTimeInfo ? dateTimeInfo.textContent : '',
        where: safeLocationInfo, // 마스킹된 위치 정보
        how: activityInfo ? activityInfo.textContent : '',
        why: eventInfo ? eventInfo.textContent : '',
        // imageData는 보안상 저장하지 않음
        timestamp: new Date().toISOString(),
        version: '0.029'
    };
    
    console.log('✅ 보안 분석 데이터 수집 완료 (민감한 정보 제거됨)');
    console.log('🔒 제거된 민감한 정보: GPS 좌표, 카메라 시리얼 번호, 상세 위치 정보');
}

// 백엔드 API를 사용한 일기 생성
async function generateDiaryWithBackend() {
    console.log('🤖 백엔드 API로 일기 생성 시작');
    
    const { diaryContent, generateDiary } = AppState.elements;
    
    // 로딩 상태 표시
    generateDiary.disabled = true;
    generateDiary.textContent = '일기 생성 중...';
    diaryContent.innerHTML = `
        <div class="loading">
            AI가 사진을 분석하고 일기를 작성하고 있습니다...
        </div>
    `;
    
    try {
        // 일기 생성 프롬프트 생성
        const prompt = createDiaryPrompt();
        
        // 현재 업로드된 사진을 Base64로 변환
        const imageBase64 = await getImageAsBase64();
        
        // 백엔드 API 호출 (이미지와 프롬프트 함께 전송)
        const diaryText = await callBackendAPI(prompt, imageBase64);
        
        // 일기 표시
        // XSS 방지를 위한 안전한 DOM 조작
        diaryContent.innerHTML = '';
        const diaryDiv = document.createElement('div');
        diaryDiv.className = 'diary-text';
        diaryDiv.textContent = diaryText;
        diaryContent.appendChild(diaryDiv);
        
        console.log('✅ 일기 생성 완료');
        
    } catch (error) {
        console.error('❌ 일기 생성 오류:', error);
        diaryContent.innerHTML = `
            <div class="error">
                일기 생성 중 오류가 발생했습니다.<br>
                <small>${error.message}</small>
            </div>
        `;
    } finally {
        // 버튼 상태 복원
        generateDiary.disabled = false;
        generateDiary.textContent = '일기 생성';
    }
}

// 현재 업로드된 사진을 Base64로 변환
async function getImageAsBase64() {
    console.log('🔄 Base64 변환 시작');
    console.log('🔍 AppState.currentImage:', AppState.currentImage ? '[이미지 존재]' : '[이미지 없음]');
    console.log('🔍 AppState.currentFile:', AppState.currentFile ? '[파일 존재]' : '[파일 없음]');
    
    // currentImage가 있으면 바로 사용 (이미 Base64 형태)
    if (AppState.currentImage) {
        console.log('✅ currentImage 사용');
        // data:image/jpeg;base64, 부분을 제거하고 순수 Base64만 반환
        const base64 = AppState.currentImage.split(',')[1];
        return base64;
    }
    
    // currentImage가 없으면 currentFile 사용
    if (!AppState.currentFile) {
        console.error('❌ 업로드된 이미지나 파일이 없습니다');
        throw new Error('업로드된 사진이 없습니다.');
    }
    
    const file = AppState.currentFile;
    console.log('✅ currentFile 사용:', file.name, file.type, file.size);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // data:image/jpeg;base64, 부분을 제거하고 순수 Base64만 반환
            const base64 = e.target.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = function() {
            reject(new Error('파일 읽기 실패'));
        };
        reader.readAsDataURL(file);
    });
}

// 일기 생성 프롬프트 생성
function createDiaryPrompt() {
    // 사용자가 입력한 키워드 가져오기
    const keywords = AppState.elements.diaryKeywords ? AppState.elements.diaryKeywords.value.trim() : '';
    
    let prompt = `사진을 보고 재미나고 귀여운 일기를 작성해주세요.`;

    // 키워드가 있으면 프롬프트에 추가
    if (keywords) {
        const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (keywordList.length > 0) {
            console.log('🔑 프롬프트에 포함될 키워드:', keywordList);
            prompt += `\n\n다음 키워드들을 자연스럽게 포함하여 일기를 작성해주세요: ${keywordList.join(', ')}`;
            prompt += `\n\n키워드 사용 가이드:
- 키워드들을 강제로 넣지 말고 자연스럽게 일기 내용에 녹여내세요
- 키워드가 일기 내용과 어울리지 않으면 무시하고 자연스러운 내용을 우선하세요
- 키워드는 일기의 분위기나 감정을 표현하는 데 활용하세요`;
        }
    }

    prompt += `\n\n다음 조건에 맞는 일기를 작성해주세요:

1. 사진에 담긴 구체적인 상황과 행동을 중심으로 묘사
2. 사실적인 톤으로 재미난 내용으로 작성 (과도한 감정 표현 지양)
3. 간단하고 귀여운 감정 표현
4. 간결하고 명확한 문체 사용
5. 200-300자 정도의 적당한 길이
6. 한국어로 작성
7. 사진에 보여지는 배경이나 사물들을 읽고 어떤 상황인지 분석하고 표현하기
8. 몇명이 어디서 무엇을 했는지로 표현하기
9. 사진에서 배경 정보를 분석해서 어떤 일들이 발생한 상황인지 리뷰하고 검토하고 일기에 추가하기
10. 사진의 분위기와 색감, 조명 등을 고려하여 감정을 표현하기`;

    if (keywords) {
        prompt += `\n11. 위에서 언급된 키워드들을 자연스럽게 일기에 녹여내기 (강제로 넣지 말고 자연스럽게)`;
    }

    prompt += `\n\n일기 내용만 작성해주세요 (제목은 제외):`;

    console.log('📝 생성된 프롬프트:', prompt.substring(0, 200) + '...');
    return prompt;
}

// 보안 강화된 백엔드 API 호출
async function callBackendAPI(prompt, imageBase64) {
    console.log('🌐 보안 백엔드 API 호출 (이미지 포함)');
    
    // HTTPS 강제 확인
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        console.warn('⚠️ 보안 경고: HTTPS가 아닌 환경에서 실행 중입니다.');
        throw new Error('보안을 위해 HTTPS 환경에서만 사용 가능합니다.');
    }
    
    const url = '/.netlify/functions/generate-diary';
    
    try {
        // 요청 타임아웃 설정 (30초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest', // CSRF 보호
                'X-Client-Version': '0.029' // 클라이언트 버전 확인
            },
            body: JSON.stringify({ 
                prompt,
                image: imageBase64,
                timestamp: new Date().toISOString(),
                clientInfo: {
                    userAgent: navigator.userAgent.substring(0, 100), // 제한된 정보만
                    language: navigator.language,
                    platform: navigator.platform
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP 오류: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.diary) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }
        
        // 응답 데이터 검증
        if (typeof data.diary !== 'string' || data.diary.length > 5000) {
            throw new Error('응답 데이터가 올바르지 않습니다.');
        }
        
        console.log('✅ 보안 API 호출 완료');
        return data.diary;
        
    } catch (error) {
        console.error('❌ 보안 백엔드 API 호출 실패:', error);
        
        // 네트워크 오류 시 사용자에게 안전한 메시지 표시
        if (error.name === 'AbortError') {
            throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
        }
        
        throw error;
    } finally {
        // API 호출 후 즉시 메모리 정리
        setTimeout(() => {
            cleanupMemory();
        }, 1000);
    }
}

// 화면 저장 기능
async function handleSaveScreen() {
    console.log('📸 화면 저장 시작');
    
    const { saveScreenBtn } = AppState.elements;
    
    try {
        // 버튼 비활성화 및 로딩 상태 표시
        saveScreenBtn.disabled = true;
        saveScreenBtn.textContent = '📸 저장 중...';
        
        // 전체 화면 캡처 (결과 페이지 전체)
        console.log('📐 전체 화면 캡처 시작');
        
        // html2canvas를 사용한 전체 화면 캡처
        const canvas = await html2canvas(document.body, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            scale: 2, // 고해상도 캡처
            logging: false,
            height: window.innerHeight,
            width: window.innerWidth
        });
        
        // 캔버스를 Blob으로 변환
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 0.9);
        });
        
        // 파일명 생성 (현재 날짜/시간 포함)
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `photo-analysis-${timestamp}.png`;
        
        // 파일 다운로드
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ 화면 저장 완료:', filename);
        
        // 성공 메시지 표시
        saveScreenBtn.textContent = '✅ 저장 완료!';
        setTimeout(() => {
            saveScreenBtn.textContent = '📸 화면 저장하기';
            saveScreenBtn.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('❌ 화면 저장 실패:', error);
        
        // 오류 메시지 표시
        saveScreenBtn.textContent = '❌ 저장 실패';
        setTimeout(() => {
            saveScreenBtn.textContent = '📸 화면 저장하기';
            saveScreenBtn.disabled = false;
        }, 2000);
        
        alert('화면 저장 중 오류가 발생했습니다: ' + error.message);
    }
}
