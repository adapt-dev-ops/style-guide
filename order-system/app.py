from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import mysql.connector
from typing import List, Optional
import uuid
import time
from gspread.exceptions import APIError
import pandas as pd
from datetime import datetime
import pytz
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

kst = pytz.timezone('Asia/Seoul')
app = FastAPI(title="Adapt Order System", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 서빙 (HTML, CSS, JS)
app.mount("/assets", StaticFiles(directory="../assets"), name="assets")

# 환경 변수에서 설정 가져오기
GOOGLE_SHEET_URL = os.getenv("GOOGLE_SHEET_URL", "https://docs.google.com/spreadsheets/d/1OyDa_VVvuzZK5dVxwdZ6_I70W2OMHf3uPdJkd8c0J24/edit?gid=0#gid=0")
JSON_KEY_PATH = os.getenv("JSON_KEY_PATH", "/home/web_test/iron-decorator-454909-j9-348e9465e40e.json")

# 데이터베이스 설정
db_config = {
    'host': os.getenv('DB_HOST', '10.178.0.2'),
    'user': os.getenv('DB_USER', 'user_fastapi'),
    'password': os.getenv('DB_PASSWORD', 'adaptkore!!'),
    'database': os.getenv('DB_NAME', 'fast_api')
}

class GoogleSheetClient:
    def __init__(self, json_key_path, url):
        scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
        credential = ServiceAccountCredentials.from_json_keyfile_name(json_key_path, scope)
        self.gs = gspread.authorize(credential)
        self.doc = self.gs.open_by_url(url)
        self.cache = None
        self.cache_time = 0
        self.cache_duration = 300  # 캐시 유효 시간 (초)

    def get_price_data(self):
        now = time.time()
        if self.cache and (now - self.cache_time) < self.cache_duration:
            return self.cache
        
        try:
            sheet2 = self.doc.worksheet('가격표')
            data = sheet2.get_all_values()
            data_row = data[10:]
            df_price = pd.DataFrame(data_row, columns=data[1])
            df_price = df_price.iloc[:, 5:]
            df_price.columns = ['품목', '가격', '비고1', '법인구분', '비고2']
            df_price = df_price[['품목', '가격', '법인구분']]
            self.cache = df_price
            self.cache_time = now
            return df_price
        
        except APIError as e:
            print(f"Google Sheets API error: {e}")
            if self.cache is not None:
                return self.cache
            else:
                return pd.DataFrame(columns=['품목', '가격', '법인구분'])

# Google Sheets 클라이언트 초기화
try:
    gs_client = GoogleSheetClient(JSON_KEY_PATH, GOOGLE_SHEET_URL)
    df_price = gs_client.get_price_data()
except Exception as e:
    print(f"Google Sheets 초기화 실패: {e}")
    gs_client = None
    df_price = pd.DataFrame(columns=['품목', '가격', '법인구분'])

def parse_price(price_str):
    try:
        return int(str(price_str).replace(",", ""))
    except:
        return 0

@app.get("/", response_class=HTMLResponse)
def get_main_page():
    """메인 페이지 (order-system.html)"""
    try:
        with open("../order-system.html", "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(content="<h1>주문 시스템 페이지를 찾을 수 없습니다.</h1>", status_code=404)

@app.get("/api/products", response_class=HTMLResponse)
def get_products():
    """상품 목록 API"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("SELECT 품목, 가격 FROM adapt_price")
        items = cursor.fetchall()

        if not items:
            return {"products": []}
        
        products = [{"name": item[0], "price": parse_price(item[1])} for item in items]
        return {"products": products}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"상품 목록 조회 실패: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.post("/submit")
async def submit_order(
    company: str = Form(...),
    orderer: str = Form(...),
    recipient: str = Form(...),
    phone: str = Form(...),
    postal_code: str = Form(...),
    address: str = Form(...),
    message: str = Form(""),
    product_name: List[Optional[str]] = Form(..., alias="product_name[]"),
    quantity: List[Optional[int]] = Form(..., alias="quantity[]")
):
    """주문 제출 API"""
    order_date = datetime.now(kst)
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        total_price = 0
        items_to_insert = []

        for pn, qty in zip(product_name, quantity):
            if not pn or not qty:
                continue

            cursor.execute("SELECT 가격 FROM adapt_price WHERE 품목 = %s", (pn,))
            price_row = cursor.fetchone()

            if not price_row:
                raise HTTPException(status_code=400, detail=f"❗ 등록되지 않은 상품: {pn}")

            price = parse_price(price_row[0])
            total_price += price * qty
            items_to_insert.append((pn, qty, price))

        if not items_to_insert:
            raise HTTPException(status_code=400, detail="❗ 주문할 상품을 선택해주세요.")

        order_code = str(uuid.uuid4())

        insert_order_query = """
            INSERT INTO orders (order_code, company, orderer, recipient, phone, postal_code, address, message, total_price, order_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        order_data = (order_code, company, orderer, recipient, phone, postal_code, address, message, total_price, order_date)
        cursor.execute(insert_order_query, order_data)
        order_id = cursor.lastrowid

        insert_item_query = """
            INSERT INTO order_items (order_id, product_name, quantity, price)
            VALUES (%s, %s, %s, %s)
        """
        for item in items_to_insert:
            cursor.execute(insert_item_query, (order_id, item[0], item[1], item[2]))

        conn.commit()

        return {
            "message": "✅ 주문이 성공적으로 등록되었습니다.",
            "total_price": total_price,
            "order_code": order_code
        }

    except HTTPException:
        raise
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"주문 처리 중 오류가 발생했습니다: {str(e)}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.get("/health")
def health_check():
    """헬스 체크 API"""
    return {"status": "healthy", "timestamp": datetime.now(kst).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 