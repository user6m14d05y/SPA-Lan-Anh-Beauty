import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, Eye, EyeOff, Plus, Trash2 } from '../../../icons.jsx';
import { useAuth } from '../../../context/AuthContext';
import { API_URL, ASSET_URL } from '../../../config';
import CustomSelect from '../../../components/common/CustomSelect';
import styles from '../Services/Services.module.css';

const statusLabels = { DRAFT: 'Bản nháp', PUBLISHED: 'Đã xuất bản', ARCHIVED: 'Đã lưu trữ' };

const getPostImage = (post) => {
  const url = post.imageUrl || post.coverImageUrl;
  if (!url) return '/Logo.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${ASSET_URL}${url}`;
};

export default function BlogAdmin() {
  const navigate = useNavigate();
  const { authFetch, hasRole } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = useCallback(async (requestedPage = 1, append = false) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (sort) params.set('sort', sort);
      if (search) params.set('q', search);
      if (requestedPage) params.set('page', String(requestedPage));
      params.set('limit', '20');

      const res = await authFetch(`${API_URL}/blog/admin/posts?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Không thể tải bài viết.');

      const payload = data.data || {};
      const items = payload.items || payload.posts || (Array.isArray(payload) ? payload : []);
      const pagination = payload.pagination || {};

      setPosts((current) => append ? [...current, ...items] : items);
      setPage(requestedPage);
      setHasMore(Boolean(pagination.hasMore));
    } catch (requestError) {
      setError(requestError.message || 'Không thể tải bài viết.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, filter, sort, search]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const changeStatus = async (post) => {
    const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await authFetch(`${API_URL}/blog/admin/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Không thể cập nhật trạng thái.');
      await loadPosts();
    } catch (requestError) { setError(requestError.message || 'Không thể cập nhật trạng thái.'); }
  };

  const removePost = async (post) => {
    if (!window.confirm(`Xóa bài viết “${post.title}”?`)) return;
    try {
      const res = await authFetch(`${API_URL}/blog/admin/posts/${post.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Không thể xóa bài viết.');
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (requestError) { setError(requestError.message || 'Không thể xóa bài viết.'); }
  };

  return (
    <div>
      {/* Top Header Bar Synchronized with Services, Users & Other Admin Pages */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Bài viết</h2>
          <p className={styles.pageDescription}>
            Quản lý nội dung cẩm nang, trạng thái xuất bản và bài viết hiển thị trên website.
          </p>
        </div>
        {hasRole('ADMIN') && (
          <button
            type="button"
            className={styles.btnPrimary}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => navigate('/admin/blog/add')}
          >
            <Plus size={18} /> Thêm bài viết
          </button>
        )}
      </div>

      {/* Filter Toolbar: Search, Status Select & Sort Select */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm bài viết theo tiêu đề..."
          className="border border-[#EBE4DD] bg-white px-4 py-2.5 text-sm min-w-0 flex-1 outline-none focus:border-[#775932] text-[#1C1612] rounded-lg"
        />

        <CustomSelect
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'PUBLISHED', label: 'Đã xuất bản' },
            { value: 'DRAFT', label: 'Bản nháp' },
            { value: 'ARCHIVED', label: 'Đã lưu trữ' },
          ]}
        />

        <CustomSelect
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          options={[
            { value: 'newest', label: 'Mới nhất' },
            { value: 'oldest', label: 'Cũ nhất' },
            { value: 'popular', label: 'Xem nhiều nhất' },
          ]}
        />
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading && posts.length === 0 ? (
        <div className={styles.stateBox}>Đang tải danh sách bài viết...</div>
      ) : posts.length === 0 ? (
        <div className={styles.stateBox}>Chưa có bài viết nào.</div>
      ) : (
        <div className={`${styles.tableContainer} rounded-lg`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Danh mục</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="flex gap-3 items-center">
                      <Link
                        to={`/blog/${post.slug}`}
                        target="_blank"
                        className="shrink-0 group"
                        title="Bấm để xem bài viết"
                      >
                        <img
                          src={getPostImage(post)}
                          alt={post.title}
                          className="w-16 h-12 object-cover bg-stone-100 border border-[#EBE4DD] rounded-md group-hover:opacity-85 transition-opacity"
                        />
                      </Link>
                      <div>
                        <Link
                          to={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-sm text-[#1C1612] font-semibold hover:text-[#775932] transition-colors line-clamp-2"
                          title="Bấm để xem bài viết"
                        >
                          {post.title}
                        </Link>
                        <div className="text-xs text-[#7A6B5D] mt-0.5">{post.authorName}</div>
                      </div>
                    </div>
                  </td>
                  <td>{post.categoryName}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${
                        post.status === 'PUBLISHED' ? styles.statusSuccess : styles.statusWarning
                      } rounded-lg`}
                    >
                      {statusLabels[post.status] || post.status}
                    </span>
                  </td>
                  <td>{post.viewCount.toLocaleString('vi-VN')}</td>
                  <td>
                    {hasRole('ADMIN') && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          title="Chỉnh sửa bài viết"
                          className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                          onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          type="button"
                          title={post.status === 'PUBLISHED' ? 'Ẩn bài viết' : 'Xuất bản bài viết'}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105 ${
                            post.status === 'PUBLISHED'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                          }`}
                          onClick={() => changeStatus(post)}
                        >
                          {post.status === 'PUBLISHED' ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          type="button"
                          title="Xóa bài viết"
                          className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center justify-center transition-all cursor-pointer shadow-xs hover:scale-105"
                          onClick={() => removePost(post)}
                        >
                          <Trash2 size={15} />
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

      {hasMore && (
        <div className="text-center mt-6">
          <button
            type="button"
            className={`${styles.btnSecondary} rounded-lg`}
            onClick={() => loadPosts(page + 1, true)}
            disabled={loading}
          >
            Tải thêm bài viết
          </button>
        </div>
      )}
    </div>
  );
}
