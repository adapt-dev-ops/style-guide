-- 주문 시스템 데이터베이스 스키마

-- 상품 가격 테이블
CREATE TABLE IF NOT EXISTS adapt_price (
    id INT AUTO_INCREMENT PRIMARY KEY,
    품목 VARCHAR(255) NOT NULL UNIQUE,
    가격 DECIMAL(10,2) NOT NULL,
    법인구분 VARCHAR(50),
    비고1 TEXT,
    비고2 TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 주문 테이블
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_code VARCHAR(36) NOT NULL UNIQUE,
    company VARCHAR(255) NOT NULL,
    orderer VARCHAR(255) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    address TEXT NOT NULL,
    message TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    order_date DATETIME NOT NULL,
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 주문 상품 테이블
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 샘플 데이터 삽입
INSERT IGNORE INTO adapt_price (품목, 가격, 법인구분) VALUES
('어댑트 스타일 가이드 기본 패키지', 50000, '개인'),
('커스텀 컴포넌트 세트', 30000, '개인'),
('프리미엄 UI 템플릿', 80000, '개인'),
('개발자 가이드북', 25000, '개인'),
('디자인 시스템 컨설팅', 150000, '법인'),
('기업용 라이센스', 200000, '법인'),
('개발 지원 서비스', 100000, '법인'),
('UI/UX 디자인 서비스', 120000, '법인');

-- 인덱스 생성
CREATE INDEX idx_orders_order_code ON orders(order_code);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_adapt_price_품목 ON adapt_price(품목); 