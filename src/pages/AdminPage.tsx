import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppUser, UserRole } from '../types/auth';
import { ConfirmDialog } from '../components/ConfirmDialog';

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
  const [editEmail, setEditEmail] = useState('');
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  // 删除确认对话框状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // 系统管理员邮箱
  const ADMIN_EMAIL = 'admin@admin.com';

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
      // 处理特定错误类型
      if (err.message && err.message.includes('邮箱已被注册')) {
        setError('该邮箱已被注册，请使用其他邮箱');
      } else {
        setError(err.message || '创建用户失败');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // 开始编辑用户
  const handleStartEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditEmail(user.email || '');
    setEditDisplayName(user.display_name || '');
    setEditPassword(''); // 清空密码字段
    setEditRole(user.role);
    setModalError(null); // 清除之前的错误
    setShowEditModal(true);
  };

  // 解析错误消息
  const parseErrorMessage = (err: any): string => {
    // 检查是否是邮箱重复错误
    if (err.message && err.message.includes('duplicate key value')) {
      return '该邮箱已被其他用户使用，请使用其他邮箱';
    }
    
    // 检查是否有详细错误信息
    if (err.details) {
      if (err.details.includes('app_users_email_key')) {
        return '该邮箱已被其他用户使用，请使用其他邮箱';
      }
    }
    
    // 默认错误消息
    return err.message || '更新用户失败，请稍后重试';
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsEditing(true);
    setModalError(null);
    setEditSuccess(false);

    try {
      const updates: any = {
        email: editEmail,
        display_name: editDisplayName,
        role: editRole,
      };
      
      // 只有当密码字段有值时才更新密码
      if (editPassword) {
        updates.password = editPassword;
      }
      
      await updateUser(editingUser.id, updates);
      // 重新加载用户列表
      const userList = await getUsers();
      setUsers(userList);
      // 重置编辑状态
      setEditingUser(null);
      setShowEditModal(false);
      setEditSuccess(true);
      // 3秒后隐藏成功消息
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: any) {
      console.error('更新用户错误:', err);
      // 设置模态框内的错误消息
      setModalError(parseErrorMessage(err));
    } finally {
      setIsEditing(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingUser(null);
    setShowEditModal(false);
    setIsEditing(false);
    setModalError(null);
  };

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteConfirm(true);
  };

  // 确认删除用户
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setError(null);
    try {
      await deleteUser(userToDelete);
      // 重新加载用户列表
      const userList = await getUsers();
      setUsers(userList);
    } catch (err: any) {
      setError(err.message || '删除用户失败');
    } finally {
      setUserToDelete(null);
    }
  };

  // 判断是否为系统管理员
  const isSystemAdmin = (email: string) => {
    return email === ADMIN_EMAIL;
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
                        {user.email}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {user.display_name || '-'}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'admin' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 border-b border-gray-200 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            编辑
                          </button>
                          {!isSystemAdmin(user.email) && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 编辑用户模态框 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">编辑用户</h3>
              
              {/* 模态框内的错误提示 */}
              {modalError && (
                <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                  <p>{modalError}</p>
                </div>
              )}
              
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="edit-email">
                    邮箱地址
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="edit-email"
                    type="email"
                    placeholder="user@example.com"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    disabled={isEditing || isSystemAdmin(editingUser?.email || '')}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="edit-display-name">
                    显示名称
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="edit-display-name"
                    type="text"
                    placeholder="显示名称"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    disabled={isEditing}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="edit-password">
                    密码 (留空表示不修改)
                  </label>
                  <input
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="edit-password"
                    type="password"
                    placeholder="新密码"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    disabled={isEditing}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="edit-role">
                    角色
                  </label>
                  <select
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="edit-role"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    disabled={isEditing || isSystemAdmin(editingUser?.email || '')}
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isEditing}
                >
                  {isEditing ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteUser}
        title="确认删除用户"
        message="确定要删除此用户吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        type="danger"
      />
    </div>
  );
};

export default AdminPage; 