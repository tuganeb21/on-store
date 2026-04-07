CREATE DATABASE IF NOT EXISTS onstore;
USE onstore;


CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    passkey       VARCHAR(255) NOT NULL,          
    role          ENUM('buyer','seller','admin') NOT NULL DEFAULT 'buyer',
    avatar_url    VARCHAR(500),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE buyers (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL UNIQUE,
    full_name     VARCHAR(100),
    phone         VARCHAR(20),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE sellers (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT NOT NULL UNIQUE,
    store_name     VARCHAR(100) NOT NULL,
    store_desc     TEXT,
    logo_url       VARCHAR(500),
    phone          VARCHAR(20),
    is_verified    BOOLEAN DEFAULT FALSE,
    rating         DECIMAL(3,2) DEFAULT 0.00,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE addresses (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    label         VARCHAR(50) DEFAULT 'Home',     
    street        VARCHAR(255),
    city          VARCHAR(100),
    country       VARCHAR(100),
    is_default    BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE categories (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(60) NOT NULL,
    slug          VARCHAR(60) NOT NULL UNIQUE,
    parent_id     INT DEFAULT NULL,               -- NULL = top-level
    icon_url      VARCHAR(500),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);


CREATE TABLE products (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    seller_id     INT NOT NULL,
    category_id   INT,
    name          VARCHAR(150) NOT NULL,
    slug          VARCHAR(150) NOT NULL UNIQUE,
    description   TEXT,
    price         DECIMAL(12,2) NOT NULL,
    stock         INT NOT NULL DEFAULT 0,
    status        ENUM('active','inactive','banned') DEFAULT 'active',
    avg_rating    DECIMAL(3,2) DEFAULT 0.00,
    total_sales   INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id)   REFERENCES sellers(id)    ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);


CREATE TABLE product_images (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    product_id    INT NOT NULL,
    image_url     VARCHAR(500) NOT NULL,
    is_primary    BOOLEAN DEFAULT FALSE,
    sort_order    INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE price_history (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    product_id    INT NOT NULL,
    old_price     DECIMAL(12,2),
    new_price     DECIMAL(12,2) NOT NULL,
    changed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE cart (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id      INT NOT NULL,
    product_id    INT NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_cart_item (buyer_id, product_id),
    FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id        INT NOT NULL,
    address_id      INT,                            
    total_amount    DECIMAL(12,2) NOT NULL,
    status          ENUM(
                        'pending',
                        'confirmed',
                        'processing',
                        'delivered',
                        'cancelled',
                        'refunded'
                    ) DEFAULT 'pending',
    payment_method  VARCHAR(50),
    payment_status  ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id)   REFERENCES buyers(id)    ON DELETE RESTRICT,
    FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE SET NULL
);


CREATE TABLE order_items (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    seller_id       INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(12,2) NOT NULL,   
    subtotal        DECIMAL(12,2) NOT NULL,
    item_status     ENUM(
                        'pending',
                        'confirmed',
                        'delivered',
                        'cancelled'
                    ) DEFAULT 'pending',
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (seller_id)  REFERENCES sellers(id)  ON DELETE RESTRICT
);


CREATE TABLE reviews (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    product_id    INT NOT NULL,
    buyer_id      INT NOT NULL,
    order_id      INT NOT NULL,               
    rating        TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title         VARCHAR(150),
    body          TEXT,
    is_verified   BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_review (product_id, buyer_id, order_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE,
    FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE
);


CREATE TABLE wishlist (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id      INT NOT NULL,
    product_id    INT NOT NULL,
    added_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist (buyer_id, product_id),
    FOREIGN KEY (buyer_id)   REFERENCES buyers(id)   ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


CREATE TABLE chat_rooms (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id      INT NOT NULL,
    seller_id     INT NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_room (buyer_id, seller_id),
    FOREIGN KEY (buyer_id)  REFERENCES buyers(id)  ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
);


CREATE TABLE messages (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    room_id       INT NOT NULL,
    sender_id     INT NOT NULL,               -- users.id
    body          TEXT NOT NULL,
    is_read       BOOLEAN DEFAULT FALSE,
    sent_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id)   REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)      ON DELETE CASCADE
);


CREATE TABLE notifications (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT NOT NULL,
    type          VARCHAR(60) NOT NULL,        -- 'order_placed', 'message', 'review', etc.
    title         VARCHAR(150),
    body          TEXT,
    is_read       BOOLEAN DEFAULT FALSE,
    reference_id  INT,                         -- e.g. order_id or message_id
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 17. USEFUL INDEXES

CREATE INDEX idx_products_seller   ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status   ON products(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);
CREATE INDEX idx_messages_room     ON messages(room_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);