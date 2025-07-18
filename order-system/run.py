#!/usr/bin/env python3
"""
FastAPI 주문 시스템 실행 스크립트
"""

import uvicorn
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"🚀 FastAPI 주문 시스템을 시작합니다...")
    print(f"📍 서버 주소: http://{host}:{port}")
    print(f"📖 API 문서: http://{host}:{port}/docs")
    print(f"🔍 헬스 체크: http://{host}:{port}/health")
    print("=" * 50)
    
    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        reload=True,  # 개발 모드에서 코드 변경 시 자동 재시작
        log_level="info",
        reload_dirs=["../"]  # 상위 디렉토리도 감시
    ) 