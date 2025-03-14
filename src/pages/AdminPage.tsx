import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppUser, UserRole } from '../types/auth';

/**
 * 用户管理页面 - 仅管理员可访问
 */
const AdminPage: React.FC = () => {
  const { isAdmin, getUsers, createUser, updateUser, deleteUser, logout } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新用户表单状态
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [isCreating, setIsCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);

  // 编辑用户状态
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userList = await getUsers();
        setUsers(userList);
      } catch (err: any) {
        setError(err.message || '加载用户列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [getUsers]);

  // 创建新用户
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);
    setCreateSuccess(false);

    try {
      await createUser(newUserEmail, newUserPassword, newUserRole, newUserDisplayName || undefined);
      // 重新加载用户列表
      const userList = await getUsers();
      setUsers(userList);
      // 重置表单
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setNewUserRole('user');
      setCreateSuccess(true);
      // 3秒后隐藏成功消息
      setTimeout(() => setCreateSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || '创建用户失败');
    } finally {
      setIsCreating(false);
    }
  };

  // 开始编辑用户
  const handleStartEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditDisplayName(user.display_name || '');
    setEditRole(user.role);
    setIsEditing(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsEditing(true);
    setError(null);
    setEditSuccess(false);

    try {
      await updateUser(editingUser.id, {
        display_name: editDisplayName,
        role: editRole,
      });
      // 重新加载用户列表
      const userList = await getUsers();
      setUsers(userList);
      // 重置编辑状态
      setEditingUser(null);
      setEditSuccess(true);
      // 3秒后隐藏成功消息
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || '更新用户失败');
    } finally {
      setIsEditing(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditing(false);
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('确定要删除此用户吗？此操作不可撤销。')) {
      return;
    }

    setError(null);
    try {
      await deleteUser(userId);
      // 重新加载用户列表
      const userList = await getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || '删除用户失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
          <div className="flex space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              返回主页
            </Link>
            <button
              onClick={() => logout()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              退出登录
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        )}

        {createSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
            <p>用户创建成功！</p>
          </div>
        )}

        {editSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
            <p>用户更新成功！</p>
          </div>
        )}

        {/* 创建新用户表单 */}
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">创建新用户</h2>
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  邮箱地址 *
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  密码 *
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="password"
                  type="password"
                  placeholder="密码"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="displayName">
                  显示名称
                </label>
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="displayName"
                  type="text"
                  placeholder="显示名称"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                  角色 *
                </label>
                <select
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="role"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  required
                  disabled={isCreating}
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? '创建中...' : '创建用户'}
              </button>
            </div>
          </form>
        </div>

        {/* 用户列表 */}
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">用户列表</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">暂无用户</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      邮箱
                    </th>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      显示名称
                    </th>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      角色
                    </th>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="py-3 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {user.id.substring(0, 8)}...
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {editingUser?.id === user.id ? (
                          <span className="text-gray-500">{user.auth_id}</span>
                        ) : (
                          <span>{user.auth_id}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {editingUser?.id === user.id ? (
                          <input
                            type="text"
                            className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editDisplayName}
                            onChange={(e) => setEditDisplayName(e.target.value)}
                            disabled={isEditing}
                          />
                        ) : (
                          <span>{user.display_name || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {editingUser?.id === user.id ? (
                          <select
                            className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value as UserRole)}
                            disabled={isEditing}
                          >
                            <option value="user">普通用户</option>
                            <option value="admin">管理员</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {editingUser?.id === user.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isEditing}
                            >
                              {isEditing ? '保存中...' : '保存'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isEditing}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </div>
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
    </div>
  );
};

export default AdminPage; 