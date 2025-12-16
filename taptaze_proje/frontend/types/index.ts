export interface Category {
  id: string;
  name: string;
  image: string | null;
}

export interface Product {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  price: number;
  unit_type: string;
  stock: number;
  image: string | null;
  description?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  unit_type: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  customer_note?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
}