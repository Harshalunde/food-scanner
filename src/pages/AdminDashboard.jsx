import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Pencil, Trash2, Save, X } from "lucide-react";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedUser, setEditedUser] = useState({ email: "", password: "" });

  // Load users from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("users")) || [];
    setUsers(stored);
  }, []);

  // Delete user
  const handleDelete = (index) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const updated = users.filter((_, i) => i !== index);
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
  };

  // Edit user
  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedUser({ ...users[index] });
  };

  // Cancel editing
  const handleCancel = () => {
    setEditingIndex(null);
    setEditedUser({ email: "", password: "" });
  };

  // Save edited user
  const handleSave = (index) => {
    if (!editedUser.email || !editedUser.password) {
      alert("Email and password cannot be empty!");
      return;
    }
    const updated = [...users];
    updated[index] = editedUser;
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
    setEditingIndex(null);
    setEditedUser({ email: "", password: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md shadow-xl rounded-3xl p-8 border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-indigo-700">Admin Dashboard</h1>
          <button
            onClick={logout}
            className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* User table */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Registered Users</h2>
        {users.length === 0 ? (
          <div className="text-gray-600 text-sm">No users registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 rounded-lg shadow-sm">
              <thead className="bg-indigo-100 text-indigo-900">
                <tr>
                  <th className="py-2 px-4 text-left">#</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Password</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={i}
                    className={`border-b hover:bg-indigo-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="py-2 px-4">{i + 1}</td>

                    {/* Editable fields */}
                    <td className="py-2 px-4">
                      {editingIndex === i ? (
                        <input
                          value={editedUser.email}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, email: e.target.value })
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        user.email
                      )}
                    </td>

                    <td className="py-2 px-4">
                      {editingIndex === i ? (
                        <input
                          value={editedUser.password}
                          onChange={(e) =>
                            setEditedUser({ ...editedUser, password: e.target.value })
                          }
                          className="border rounded px-2 py-1 w-full"
                        />
                      ) : (
                        <span className="font-mono text-gray-700">{user.password}</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2 px-4 text-center space-x-2">
                      {editingIndex === i ? (
                        <>
                          <button
                            onClick={() => handleSave(i)}
                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded"
                            title="Save"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 bg-gray-400 hover:bg-gray-500 text-white rounded"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(i)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
