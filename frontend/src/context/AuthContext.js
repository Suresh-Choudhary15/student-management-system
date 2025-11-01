import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/me/profile`);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (email, password, name, role) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        name,
        role,
      });
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      setToken(token);
      setUser(user);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common["Authorization"];
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    API_URL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
