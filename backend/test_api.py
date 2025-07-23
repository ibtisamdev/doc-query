#!/usr/bin/env python3
"""
Simple test script for Doc Query Backend API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health Check: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_detailed_health():
    """Test the detailed health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/health/detailed")
        print(f"Detailed Health Check: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Detailed health check failed: {e}")
        return False

def test_root_endpoint():
    """Test the root endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root Endpoint: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Root endpoint failed: {e}")
        return False

def test_documents_endpoint():
    """Test the documents endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/documents/")
        print(f"Documents Endpoint: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Documents endpoint failed: {e}")
        return False

def test_chat_sessions():
    """Test the chat sessions endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/chat/sessions")
        print(f"Chat Sessions: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Chat sessions failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing Doc Query Backend API...")
    print("=" * 50)
    
    tests = [
        test_root_endpoint,
        test_health_endpoint,
        test_detailed_health,
        test_documents_endpoint,
        test_chat_sessions
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        print(f"\nRunning {test.__name__}...")
        if test():
            passed += 1
            print("✅ PASSED")
        else:
            print("❌ FAILED")
    
    print(f"\n{'=' * 50}")
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the server logs.") 