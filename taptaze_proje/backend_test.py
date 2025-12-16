#!/usr/bin/env python3
"""
Taptaze Manav Uygulaması Backend Test Suite
Tests all backend endpoints for the grocery delivery app
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://manav-online.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.admin_token = None
        self.test_category_id = None
        self.test_product_id = None
        self.test_order_id = None
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response"] = response_data
        self.test_results.append(result)
        print(f"{status} {test_name}: {details}")
        
    def test_seed_data(self):
        """Test POST /api/seed endpoint"""
        print("\n=== Testing Seed Data ===")
        try:
            response = self.session.post(f"{BACKEND_URL}/seed")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and "admin" in data:
                    self.log_test("Seed Data", True, 
                                f"Seed data loaded successfully. Admin credentials: {data['admin']}")
                    return True
                else:
                    self.log_test("Seed Data", False, 
                                f"Invalid response format: {data}")
            else:
                self.log_test("Seed Data", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Seed Data", False, f"Exception: {str(e)}")
        return False
        
    def test_categories(self):
        """Test GET /api/categories endpoint"""
        print("\n=== Testing Categories ===")
        try:
            response = self.session.get(f"{BACKEND_URL}/categories")
            
            if response.status_code == 200:
                categories = response.json()
                if isinstance(categories, list) and len(categories) > 0:
                    # Store first category ID for product testing
                    self.test_category_id = categories[0]["id"]
                    category_names = [cat["name"] for cat in categories]
                    self.log_test("Get Categories", True, 
                                f"Found {len(categories)} categories: {category_names}")
                    return True
                else:
                    self.log_test("Get Categories", False, 
                                f"Empty or invalid categories list: {categories}")
            else:
                self.log_test("Get Categories", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get Categories", False, f"Exception: {str(e)}")
        return False
        
    def test_products(self):
        """Test product endpoints"""
        print("\n=== Testing Products ===")
        
        # Test GET /api/products (all products)
        try:
            response = self.session.get(f"{BACKEND_URL}/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    # Store first product ID for detailed testing
                    self.test_product_id = products[0]["id"]
                    self.log_test("Get All Products", True, 
                                f"Found {len(products)} products")
                    
                    # Verify category names are included
                    has_category_names = all("category_name" in p for p in products)
                    if has_category_names:
                        self.log_test("Product Category Names", True, 
                                    "All products have category names")
                    else:
                        self.log_test("Product Category Names", False, 
                                    "Some products missing category names")
                else:
                    self.log_test("Get All Products", False, 
                                f"Empty or invalid products list: {products}")
                    return False
            else:
                self.log_test("Get All Products", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get All Products", False, f"Exception: {str(e)}")
            return False
            
        # Test GET /api/products?category_id={id}
        if self.test_category_id:
            try:
                response = self.session.get(f"{BACKEND_URL}/products?category_id={self.test_category_id}")
                
                if response.status_code == 200:
                    filtered_products = response.json()
                    if isinstance(filtered_products, list):
                        self.log_test("Filter Products by Category", True, 
                                    f"Found {len(filtered_products)} products in category")
                    else:
                        self.log_test("Filter Products by Category", False, 
                                    f"Invalid response: {filtered_products}")
                else:
                    self.log_test("Filter Products by Category", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("Filter Products by Category", False, f"Exception: {str(e)}")
        
        # Test GET /api/products?search=domates
        try:
            response = self.session.get(f"{BACKEND_URL}/products?search=domates")
            
            if response.status_code == 200:
                search_results = response.json()
                if isinstance(search_results, list):
                    # Check if results contain "domates" in name
                    tomato_found = any("domates" in p["name"].lower() for p in search_results)
                    if tomato_found:
                        self.log_test("Search Products", True, 
                                    f"Search for 'domates' returned {len(search_results)} results")
                    else:
                        self.log_test("Search Products", False, 
                                    f"Search for 'domates' didn't return expected results")
                else:
                    self.log_test("Search Products", False, 
                                f"Invalid search response: {search_results}")
            else:
                self.log_test("Search Products", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Search Products", False, f"Exception: {str(e)}")
            
        # Test GET /api/products/{product_id}
        if self.test_product_id:
            try:
                response = self.session.get(f"{BACKEND_URL}/products/{self.test_product_id}")
                
                if response.status_code == 200:
                    product = response.json()
                    if "id" in product and "name" in product:
                        self.log_test("Get Single Product", True, 
                                    f"Retrieved product: {product['name']}")
                    else:
                        self.log_test("Get Single Product", False, 
                                    f"Invalid product response: {product}")
                else:
                    self.log_test("Get Single Product", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("Get Single Product", False, f"Exception: {str(e)}")
                
        # Test invalid product ID
        try:
            response = self.session.get(f"{BACKEND_URL}/products/invalid_id")
            
            if response.status_code == 404 or response.status_code == 400:
                self.log_test("Invalid Product ID Error Handling", True, 
                            f"Correctly returned error for invalid ID: {response.status_code}")
            else:
                self.log_test("Invalid Product ID Error Handling", False, 
                            f"Unexpected response for invalid ID: {response.status_code}")
                
        except Exception as e:
            self.log_test("Invalid Product ID Error Handling", False, f"Exception: {str(e)}")
            
        return True
        
    def test_orders(self):
        """Test order endpoints"""
        print("\n=== Testing Orders ===")
        
        # Test POST /api/orders (create order)
        if not self.test_product_id:
            self.log_test("Create Order", False, "No product ID available for testing")
            return False
            
        order_data = {
            "customer_name": "Ahmet Yılmaz",
            "customer_phone": "05551234567",
            "delivery_address": "Kadıköy, İstanbul",
            "customer_note": "Kapı zili çalışmıyor, arayın lütfen",
            "items": [
                {
                    "product_id": self.test_product_id,
                    "product_name": "Domates",
                    "product_image": None,
                    "quantity": 2.5,
                    "price": 25.90,
                    "unit_type": "KG"
                }
            ],
            "total_amount": 64.75
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/orders", 
                                       json=order_data,
                                       headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                order = response.json()
                if "id" in order and order.get("status") == "Beklemede":
                    self.test_order_id = order["id"]
                    self.log_test("Create Order", True, 
                                f"Order created successfully with ID: {order['id']}")
                else:
                    self.log_test("Create Order", False, 
                                f"Invalid order response: {order}")
            else:
                self.log_test("Create Order", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Create Order", False, f"Exception: {str(e)}")
            
        # Test GET /api/orders (list all orders)
        try:
            response = self.session.get(f"{BACKEND_URL}/orders")
            
            if response.status_code == 200:
                orders = response.json()
                if isinstance(orders, list):
                    self.log_test("Get All Orders", True, 
                                f"Retrieved {len(orders)} orders")
                    
                    # Verify our created order is in the list
                    if self.test_order_id:
                        order_found = any(o["id"] == self.test_order_id for o in orders)
                        if order_found:
                            self.log_test("Order Persistence", True, 
                                        "Created order found in orders list")
                        else:
                            self.log_test("Order Persistence", False, 
                                        "Created order not found in orders list")
                else:
                    self.log_test("Get All Orders", False, 
                                f"Invalid orders response: {orders}")
            else:
                self.log_test("Get All Orders", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Get All Orders", False, f"Exception: {str(e)}")
            
        return True
        
    def test_admin_operations(self):
        """Test admin endpoints"""
        print("\n=== Testing Admin Operations ===")
        
        # Test POST /api/admin/login
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/admin/login", 
                                       json=login_data,
                                       headers={"Content-Type": "application/json"})
            
            if response.status_code == 200:
                login_result = response.json()
                if login_result.get("success"):
                    self.log_test("Admin Login", True, 
                                f"Admin login successful: {login_result.get('message')}")
                else:
                    self.log_test("Admin Login", False, 
                                f"Login failed: {login_result}")
            else:
                self.log_test("Admin Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            
        # Test wrong credentials
        wrong_login = {
            "username": "admin",
            "password": "wrongpassword"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/admin/login", 
                                       json=wrong_login,
                                       headers={"Content-Type": "application/json"})
            
            if response.status_code == 401:
                self.log_test("Admin Login Error Handling", True, 
                            "Correctly rejected wrong credentials")
            else:
                self.log_test("Admin Login Error Handling", False, 
                            f"Unexpected response for wrong credentials: {response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Login Error Handling", False, f"Exception: {str(e)}")
            
        # Test POST /api/admin/products (create product)
        if not self.test_category_id:
            self.log_test("Admin Create Product", False, "No category ID available for testing")
        else:
            new_product = {
                "name": "Test Ürünü",
                "category_id": self.test_category_id,
                "price": 19.99,
                "unit_type": "ADET",
                "stock": 25,
                "description": "Test için oluşturulan ürün"
            }
            
            try:
                response = self.session.post(f"{BACKEND_URL}/admin/products", 
                                           json=new_product,
                                           headers={"Content-Type": "application/json"})
                
                if response.status_code == 200:
                    created_product = response.json()
                    if "id" in created_product:
                        new_product_id = created_product["id"]
                        self.log_test("Admin Create Product", True, 
                                    f"Product created with ID: {new_product_id}")
                        
                        # Test PUT /api/admin/products/{id} (update product)
                        updated_product = new_product.copy()
                        updated_product["price"] = 24.99
                        updated_product["stock"] = 30
                        
                        try:
                            response = self.session.put(f"{BACKEND_URL}/admin/products/{new_product_id}", 
                                                      json=updated_product,
                                                      headers={"Content-Type": "application/json"})
                            
                            if response.status_code == 200:
                                updated_result = response.json()
                                if updated_result.get("price") == 24.99:
                                    self.log_test("Admin Update Product", True, 
                                                f"Product updated successfully")
                                else:
                                    self.log_test("Admin Update Product", False, 
                                                f"Product not updated correctly: {updated_result}")
                            else:
                                self.log_test("Admin Update Product", False, 
                                            f"HTTP {response.status_code}: {response.text}")
                                
                        except Exception as e:
                            self.log_test("Admin Update Product", False, f"Exception: {str(e)}")
                            
                        # Test DELETE /api/admin/products/{id} (delete product)
                        try:
                            response = self.session.delete(f"{BACKEND_URL}/admin/products/{new_product_id}")
                            
                            if response.status_code == 200:
                                delete_result = response.json()
                                if delete_result.get("success"):
                                    self.log_test("Admin Delete Product", True, 
                                                "Product deleted successfully")
                                else:
                                    self.log_test("Admin Delete Product", False, 
                                                f"Delete failed: {delete_result}")
                            else:
                                self.log_test("Admin Delete Product", False, 
                                            f"HTTP {response.status_code}: {response.text}")
                                
                        except Exception as e:
                            self.log_test("Admin Delete Product", False, f"Exception: {str(e)}")
                            
                    else:
                        self.log_test("Admin Create Product", False, 
                                    f"Invalid product creation response: {created_product}")
                else:
                    self.log_test("Admin Create Product", False, 
                                f"HTTP {response.status_code}: {response.text}")
                    
            except Exception as e:
                self.log_test("Admin Create Product", False, f"Exception: {str(e)}")
                
        # Test PATCH /api/admin/orders/{id} (update order status)
        if self.test_order_id:
            status_updates = ["Hazırlanıyor", "Teslim Edildi"]
            
            for status in status_updates:
                try:
                    response = self.session.patch(f"{BACKEND_URL}/admin/orders/{self.test_order_id}", 
                                                json={"status": status},
                                                headers={"Content-Type": "application/json"})
                    
                    if response.status_code == 200:
                        update_result = response.json()
                        if update_result.get("success"):
                            self.log_test(f"Admin Update Order Status to {status}", True, 
                                        f"Order status updated to {status}")
                        else:
                            self.log_test(f"Admin Update Order Status to {status}", False, 
                                        f"Status update failed: {update_result}")
                    else:
                        self.log_test(f"Admin Update Order Status to {status}", False, 
                                    f"HTTP {response.status_code}: {response.text}")
                        
                except Exception as e:
                    self.log_test(f"Admin Update Order Status to {status}", False, f"Exception: {str(e)}")
        else:
            self.log_test("Admin Update Order Status", False, "No order ID available for testing")
            
        return True
        
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"🚀 Starting Taptaze Manav Backend Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Run tests in sequence
        self.test_seed_data()
        self.test_categories()
        self.test_products()
        self.test_orders()
        self.test_admin_operations()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result["status"])
        
        print(f"Total Tests: {len(self.test_results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(self.test_results)*100):.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if "❌ FAIL" in result["status"]:
                    print(f"  - {result['test']}: {result['details']}")
                    
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if "✅ PASS" in result["status"]:
                print(f"  - {result['test']}")
                
        return failed == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)