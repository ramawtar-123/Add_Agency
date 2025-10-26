import requests
import sys
import json
from datetime import datetime, timedelta

class AgencyAPITester:
    def __init__(self, base_url="https://ad-agency-app-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_resources = {
            'clients': [],
            'projects': [],
            'invoices': []
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!",
            "role": "admin"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_auth_login(self):
        """Test user login with existing credentials"""
        login_data = {
            "username": "testuser_123456",  # This might not exist, but we'll try
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        return success

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        
        if success:
            expected_keys = ['total_clients', 'active_projects', 'total_revenue', 'pending_invoices']
            for key in expected_keys:
                if key not in response:
                    print(f"   Warning: Missing key '{key}' in stats response")
                    return False
            print(f"   Stats: {response}")
        
        return success

    def test_create_client(self):
        """Test creating a client"""
        client_data = {
            "name": "Test Client Corp",
            "email": "client@testcorp.com",
            "phone": "+1-555-0123",
            "company": "Test Corporation",
            "address": "123 Test Street, Test City, TC 12345",
            "status": "active"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if success and 'id' in response:
            self.created_resources['clients'].append(response['id'])
            print(f"   Created client ID: {response['id']}")
        
        return success

    def test_get_clients(self):
        """Test getting all clients"""
        success, response = self.run_test(
            "Get All Clients",
            "GET",
            "clients",
            200
        )
        
        if success:
            print(f"   Found {len(response)} clients")
        
        return success

    def test_create_project(self):
        """Test creating a project"""
        if not self.created_resources['clients']:
            print("   Skipping project creation - no clients available")
            return False
            
        project_data = {
            "name": "Test Project Alpha",
            "client_id": self.created_resources['clients'][0],
            "description": "A comprehensive test project for our testing suite",
            "start_date": "2024-01-15",
            "end_date": "2024-06-15",
            "status": "active",
            "budget": 50000.00,
            "team_members": []
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.created_resources['projects'].append(response['id'])
            print(f"   Created project ID: {response['id']}")
        
        return success

    def test_get_projects(self):
        """Test getting all projects"""
        success, response = self.run_test(
            "Get All Projects",
            "GET",
            "projects",
            200
        )
        
        if success:
            print(f"   Found {len(response)} projects")
        
        return success

    def test_get_team(self):
        """Test getting team members"""
        success, response = self.run_test(
            "Get Team Members",
            "GET",
            "team",
            200
        )
        
        if success:
            print(f"   Found {len(response)} team members")
        
        return success

    def test_create_invoice(self):
        """Test creating an invoice"""
        if not self.created_resources['clients']:
            print("   Skipping invoice creation - no clients available")
            return False
            
        due_date = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')
        invoice_data = {
            "client_id": self.created_resources['clients'][0],
            "project_id": self.created_resources['projects'][0] if self.created_resources['projects'] else None,
            "amount": 5000.00,
            "status": "pending",
            "due_date": due_date,
            "items": [
                {
                    "description": "Web Development Services",
                    "quantity": 40,
                    "rate": 100.00,
                    "amount": 4000.00
                },
                {
                    "description": "Project Management",
                    "quantity": 10,
                    "rate": 100.00,
                    "amount": 1000.00
                }
            ],
            "notes": "Payment terms: Net 30 days"
        }
        
        success, response = self.run_test(
            "Create Invoice",
            "POST",
            "invoices",
            200,
            data=invoice_data
        )
        
        if success and 'id' in response:
            self.created_resources['invoices'].append(response['id'])
            print(f"   Created invoice ID: {response['id']}")
            print(f"   Invoice number: {response.get('invoice_number', 'N/A')}")
        
        return success

    def test_get_invoices(self):
        """Test getting all invoices"""
        success, response = self.run_test(
            "Get All Invoices",
            "GET",
            "invoices",
            200
        )
        
        if success:
            print(f"   Found {len(response)} invoices")
        
        return success

    def test_update_client(self):
        """Test updating a client"""
        if not self.created_resources['clients']:
            print("   Skipping client update - no clients available")
            return False
            
        client_id = self.created_resources['clients'][0]
        update_data = {
            "name": "Updated Test Client Corp",
            "email": "updated@testcorp.com",
            "phone": "+1-555-9999",
            "company": "Updated Test Corporation",
            "address": "456 Updated Street, New City, NC 54321",
            "status": "active"
        }
        
        success, response = self.run_test(
            "Update Client",
            "PUT",
            f"clients/{client_id}",
            200,
            data=update_data
        )
        
        return success

    def test_delete_resources(self):
        """Test deleting created resources"""
        success_count = 0
        total_count = 0
        
        # Delete invoices first (they depend on clients/projects)
        for invoice_id in self.created_resources['invoices']:
            total_count += 1
            success, _ = self.run_test(
                f"Delete Invoice {invoice_id}",
                "DELETE",
                f"invoices/{invoice_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete projects
        for project_id in self.created_resources['projects']:
            total_count += 1
            success, _ = self.run_test(
                f"Delete Project {project_id}",
                "DELETE",
                f"projects/{project_id}",
                200
            )
            if success:
                success_count += 1
        
        # Delete clients
        for client_id in self.created_resources['clients']:
            total_count += 1
            success, _ = self.run_test(
                f"Delete Client {client_id}",
                "DELETE",
                f"clients/{client_id}",
                200
            )
            if success:
                success_count += 1
        
        return success_count == total_count

def main():
    print("🚀 Starting Agency Management API Tests")
    print("=" * 50)
    
    tester = AgencyAPITester()
    
    # Test sequence
    test_results = []
    
    # Authentication tests
    test_results.append(("User Registration", tester.test_auth_register()))
    if not tester.token:
        print("\n❌ Cannot continue without authentication token")
        return 1
    
    test_results.append(("Get Current User", tester.test_auth_me()))
    
    # Dashboard tests
    test_results.append(("Dashboard Stats", tester.test_dashboard_stats()))
    
    # Client tests
    test_results.append(("Create Client", tester.test_create_client()))
    test_results.append(("Get All Clients", tester.test_get_clients()))
    test_results.append(("Update Client", tester.test_update_client()))
    
    # Project tests
    test_results.append(("Create Project", tester.test_create_project()))
    test_results.append(("Get All Projects", tester.test_get_projects()))
    
    # Team tests
    test_results.append(("Get Team Members", tester.test_get_team()))
    
    # Invoice tests
    test_results.append(("Create Invoice", tester.test_create_invoice()))
    test_results.append(("Get All Invoices", tester.test_get_invoices()))
    
    # Cleanup tests
    test_results.append(("Delete Resources", tester.test_delete_resources()))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())