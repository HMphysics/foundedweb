import requests
import sys
from datetime import datetime

class PropForgeAPITester:
    def __init__(self, base_url="https://noir-archive-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_json = response.json()
                    print(f"   Response: {response_json}")
                    return True, response_json
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_response = response.json()
                    print(f"   Error Response: {error_response}")
                except:
                    print(f"   Error Text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )
        return success

    def test_status_endpoints(self):
        """Test status check endpoints"""
        # Test POST status
        success1, response1 = self.run_test(
            "Create Status Check",
            "POST",
            "api/status",
            200,
            data={"client_name": "test_client"}
        )
        
        # Test GET status
        success2, response2 = self.run_test(
            "Get Status Checks",
            "GET",
            "api/status",
            200
        )
        
        return success1 and success2

    def test_user_plan_without_auth(self):
        """Test user plan endpoint without authentication"""
        success, response = self.run_test(
            "User Plan (No Auth)",
            "GET",
            "api/user/plan",
            401
        )
        return success

    def test_user_plan_with_invalid_token(self):
        """Test user plan endpoint with invalid token"""
        success, response = self.run_test(
            "User Plan (Invalid Token)",
            "GET",
            "api/user/plan",
            401,
            headers={'Authorization': 'Bearer invalid_token_123'}
        )
        return success

    def authenticate_user(self):
        """Authenticate with Supabase and get token"""
        print(f"\n🔐 Authenticating user...")
        
        # Use Supabase client to authenticate
        try:
            from supabase import create_client
            import os
            
            supabase_url = "https://ccsffbcgwturyqnqqjnm.supabase.co"
            supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZmYmNnd3R1cnlxbnFxam5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NjY4MjMsImV4cCI6MjA5MjM0MjgyM30.uSZmSWjxpUYtv1lCOILi1PgkuX5bh4cgVq7PWuDURoI"
            
            supabase = create_client(supabase_url, supabase_key)
            
            # Sign in with test credentials
            response = supabase.auth.sign_in_with_password({
                "email": "browser1776782567@propforge.dev",
                "password": "Test123!"
            })
            
            if response.session and response.session.access_token:
                self.token = response.session.access_token
                self.user_id = response.user.id if response.user else None
                print(f"✅ Authentication successful")
                print(f"   User ID: {self.user_id}")
                print(f"   Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ Authentication failed - No session or token")
                return False
                
        except Exception as e:
            print(f"❌ Authentication failed - Error: {str(e)}")
            return False

    def test_user_plan_with_auth(self):
        """Test user plan endpoint with valid authentication"""
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        success, response = self.run_test(
            "User Plan (With Auth)",
            "GET",
            "api/user/plan",
            200
        )
        
        if success and response:
            # Verify response structure
            expected_fields = ['plan', 'status', 'features']
            for field in expected_fields:
                if field not in response:
                    print(f"❌ Missing field '{field}' in response")
                    return False
            
            # Verify plan features structure
            features = response.get('features', {})
            expected_feature_fields = ['firms_allowed', 'modes', 'compare', 'export', 'post_pass', 'commissions', 'behavioral', 'save_configs']
            for field in expected_feature_fields:
                if field not in features:
                    print(f"❌ Missing feature field '{field}' in response")
                    return False
            
            print(f"✅ User plan response structure is valid")
            print(f"   Plan: {response.get('plan')}")
            print(f"   Status: {response.get('status')}")
            print(f"   Features: {features}")
            
        return success

def main():
    print("🚀 Starting Prop Forge API Tests")
    print("=" * 50)
    
    # Setup
    tester = PropForgeAPITester()
    
    # Test basic endpoints first
    print("\n📋 Testing Basic Endpoints")
    tester.test_root_endpoint()
    tester.test_status_endpoints()
    
    # Test authentication-related endpoints
    print("\n🔒 Testing Authentication")
    tester.test_user_plan_without_auth()
    tester.test_user_plan_with_invalid_token()
    
    # Authenticate user
    if not tester.authenticate_user():
        print("\n❌ Cannot proceed with authenticated tests - authentication failed")
        print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
        return 1
    
    # Test authenticated endpoints
    print("\n👤 Testing Authenticated Endpoints")
    tester.test_user_plan_with_auth()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())