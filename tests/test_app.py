from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_read_root():
    """Test that the root endpoint redirects to static/index.html"""
    # don't follow redirects so we can assert the redirect response
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 307  # Temporary redirect
    assert response.headers["location"] == "/static/index.html"

def test_get_activities():
    """Test getting the list of activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    # Check some required activities exist
    assert "Chess Club" in data
    assert "Programming Class" in data
    # Check activity structure
    activity = data["Chess Club"]
    assert all(key in activity for key in ["description", "schedule", "max_participants", "participants"])

def test_signup_for_activity():
    """Test signing up for an activity"""
    activity_name = "Chess Club"
    email = "test@mergington.edu"
    
    # Try to sign up
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Signed up {email} for {activity_name}"
    
    # Verify student is in participants list
    activities_response = client.get("/activities")
    assert email in activities_response.json()[activity_name]["participants"]
    
    # Try to sign up again (should fail)
    response = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"].lower()

def test_unregister_from_activity():
    """Test unregistering from an activity"""
    activity_name = "Programming Class"
    email = "emma@mergington.edu"  # Using an existing participant
    
    # Try to unregister
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == f"Unregistered {email} from {activity_name}"
    
    # Verify student is removed from participants list
    activities_response = client.get("/activities")
    assert email not in activities_response.json()[activity_name]["participants"]
    
    # Try to unregister again (should fail)
    response = client.post(f"/activities/{activity_name}/unregister?email={email}")
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"].lower()

def test_activity_not_found():
    """Test error handling for non-existent activity"""
    response = client.post("/activities/NonexistentClub/signup?email=test@mergington.edu")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()