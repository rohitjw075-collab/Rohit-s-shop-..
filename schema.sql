-- Database Setup for Rohit's Shop Management System
CREATE DATABASE IF NOT EXISTS rohit_shop_db;
USE rohit_shop_db;

-- Products Master Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Barcode Products
INSERT INTO products (barcode, product_name, price, stock_quantity) VALUES
('1001', 'Fresh Milk (1L)', 60.00, 100),
('1002', 'Whole Wheat Bread', 40.00, 50),
('1003', 'Organic Green Tea', 150.00, 30),
('1004', 'Potato Chips (Large)', 35.00, 200),
('1005', 'Dark Chocolate Bar', 90.00, 80);

-- Sales Bills / Transactions Table
CREATE TABLE IF NOT EXISTS sales_bills (
    bill_id INT AUTO_INCREMENT PRIMARY KEY,
    payment_method ENUM('ONLINE', 'OFFLINE') NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    upi_vpa VARCHAR(100) DEFAULT '8329461513@axl',
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill Line Items Breakdown
CREATE TABLE IF NOT EXISTS bill_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES sales_bills(bill_id) ON DELETE CASCADE
);
