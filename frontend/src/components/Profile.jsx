import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./profile.css"

function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/profile', {
        headers: { Authorization: token }
      });
      setProfile(response.data);
    };

    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    const token = localStorage.getItem('token');
    await axios.put('http://localhost:8000/profile', profile, {
      headers: { Authorization: token }
    });
    alert('Profile updated!');
  };

  return (
    <div className='profile-container'>
    <div className="profile">
      <h2>Profile</h2>
      <input
        type="text"
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
      />
      <input
        type="email"
        value={profile.email}
        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
      />
      <button onClick={handleUpdate}>Update Profile</button>
    </div>
    </div>
  );
}

export default Profile;
