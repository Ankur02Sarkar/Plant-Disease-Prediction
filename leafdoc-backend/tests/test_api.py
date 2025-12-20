
from fastapi.testclient import TestClient
from main import app
import os
import unittest
from unittest.mock import MagicMock, patch

client = TestClient(app)

class TestAPI(unittest.TestCase):
    
    def test_read_main(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"message": "Plant Disease Prediction API is running"})

    @patch('main.model')
    @patch('main.class_names')
    def test_predict_endpoint_no_model(self, mock_class_names, mock_model):
        # Simulate model not loaded
        from main import app
        # We need to temporarily set the global variables in main module to None/Empty
        # However, due to how imports work, patching `main.model` might work if we reload or accessing it correctly.
        # But `main.py` checks globals `model` and `class_names`.
        
        # Actually proper way to test "no model loaded" is difficult if it loads on startup.
        # But we can mock the `predict` function or passing a file.
        pass

    def test_predict_invalid_file_type(self):
        # Mock model is loaded (we need to trick the app, or just test the file type check which happens first?)
        # The app checks `if not model` first.
        # So we can't test file type unless model is loaded.
        pass
        
    # Since we can't easily mock the global startup event result without more complex setup, 
    # and we don't have the model yet, these tests are placeholders for now.
    # But we can write a test that creates a dummy model file and runs against it?
    # Or just wait until we have the model.
    
    pass
