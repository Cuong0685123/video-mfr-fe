import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Link as LinkIcon, Loader2, Plus, Globe, Layers, X, ExternalLink, Play } from 'lucide-react';
import VideoCard from './VideoCard';

export default function VideoSearchGallery() {
  const [searchMode, setSearchMode] = useState('keyword');
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState('bing');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [linkInput, setLinkInput] = useState('');

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [directStreamUrl, setDirectStreamUrl] = useState(null);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCloseModal();
    };
    if (selectedVideo) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedVideo]);

  const getSafeStreamUrl = (url = '') => {
    if (!url) return '';
    if (url.includes('twimg.com') || url.includes('twitter.com') || url.includes('x.com')) {
      return `https://omnisearch-backend-fxr7.onrender.com/api/proxy-video?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handleKeywordSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setPage(1);
    setHasMore(true);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/videos?q=${encodeURIComponent(query)}&page=1&engine=${engine}`
      );
      const data = res.data.data || [];
      setVideos(data);
      setHasMore(res.data.hasMore !== false && data.length > 0);
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setVideos([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractFromLink = async (e) => {
    e?.preventDefault();
    if (!linkInput.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setHasMore(false);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/extract-from-web?url=${encodeURIComponent(linkInput.trim())}`
      );
      const data = res.data.data || [];
      setVideos(data);
    } catch (err) {
      console.error('Lỗi bóc tách video từ link:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEngineChange = (newEngine) => {
    if (newEngine === engine) return;
    setEngine(newEngine);
    if (query.trim()) {
      setLoading(true);
      setPage(1);
      axios
        .get(`https://omnisearch-backend-fxr7.onrender.com/api/videos?q=${encodeURIComponent(query)}&page=1&engine=${newEngine}`)
        .then((res) => {
          setVideos(res.data.data || []);
          setHasMore(res.data.hasMore !== false && (res.data.data || []).length > 0);
        })
        .catch(() => setVideos([]))
        .finally(() => setLoading(false));
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);

    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/videos?q=${encodeURIComponent(query)}&page=${nextPage}&engine=${engine}`
      );
      const newVideos = res.data.data || [];

      if (newVideos.length === 0 || res.data.hasMore === false) {
        setHasMore(false);
      }

      setVideos((prev) => {
        const existingUrls = new Set(prev.map((v) => v.videoUrl));
        const filteredNew = newVideos.filter((v) => !existingUrls.has(v.videoUrl));
        return [...prev, ...filteredNew];
      });

      setPage(nextPage);
    } catch (err) {
      console.error('Lỗi tải thêm:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const isDirectVideoStream = (url = '') => {
    return /\.(mp4|webm|m3u8|ogg)($|\?)/i.test(url);
  };

  const handleSelectVideo = async (video) => {
    setSelectedVideo(video);
    setDirectStreamUrl(null);

    if (video.streamUrl) {
      setDirectStreamUrl(video.streamUrl);
      return;
    }

    if (isDirectVideoStream(video.videoUrl)) {
      setDirectStreamUrl(video.videoUrl);
      return;
    }

    setExtracting(true);
    try {
      const res = await axios.get(
        `https://omnisearch-backend-fxr7.onrender.com/api/extract-video?url=${encodeURIComponent(video.videoUrl)}`
      );
      if (res.data?.success && res.data?.streamUrl) {
        setDirectStreamUrl(res.data.streamUrl);
      }
    } catch (err) {
      console.warn('Không thể bóc tách link:', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedVideo(null);
    setDirectStreamUrl(null);
    setExtracting(false);
  };

  const openPopupWindow = (url) => {
    if (!url) return;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full max-w-full flex-1 flex flex-col relative items-center">
      {/* 2 nút chuyển chế độ */}
      <div className="w-full max-w-xl mx-auto mb-3 px-1">
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setSearchMode('keyword');
              setVideos([]);
              setHasSearched(false);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              searchMode === 'keyword'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search size={14} />
            Tìm theo từ khóa
          </button>

          <button
            type="button"
            onClick={() => {
              setSearchMode('link');
              setVideos([]);
              setHasSearched(false);
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              searchMode === 'link'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon size={14} />
            Bóc video từ Link Web
          </button>
        </div>
      </div>

      {/* Khung Input */}
      <div className="w-full max-w-xl mx-auto mb-5 px-1">
        {searchMode === 'keyword' ? (
          <div>
            <form onSubmit={handleKeywordSearch} className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nhập từ khóa tìm video..."
                  style={{
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    WebkitTextFillColor: '#0f172a',
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/20"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tìm'}
              </button>
            </form>

            {/* Dãy nút nguồn: Hỗ trợ co giãn gọn gàng trên mobile */}
            <div className="flex items-center justify-center gap-2 mt-3 overflow-x-auto no-scrollbar py-1 w-full">
              <button
                type="button"
                onClick={() => handleEngineChange('bing')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  engine === 'bing'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Globe size={13} />
                <span>Nguồn 1 <span className="hidden sm:inline">(Bing)</span></span>
              </button>
              <button
                type="button"
                onClick={() => handleEngineChange('yandex')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                  engine === 'yandex'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers size={13} />
                <span>Nguồn 2 <span className="hidden sm:inline">(DuckDuckGo)</span></span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleExtractFromLink} className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Dán link bài viết (VD: https://x.com/...)..."
                style={{
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  WebkitTextFillColor: '#0f172a',
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Bóc video'}
            </button>
          </form>
        )}
      </div>

      {/* Thông tin số lượng */}
      {videos.length > 0 && (
        <div className="w-full flex justify-between items-center text-xs text-slate-400 pb-2.5 border-b border-slate-800/80 mb-4 px-1">
          <span>Tìm thấy: <strong className="text-slate-200">{videos.length}</strong> video</span>
          <span>{searchMode === 'keyword' ? `Nguồn: ${engine.toUpperCase()}` : 'Bóc tách từ link'}</span>
        </div>
      )}

      {/* Lưới danh sách Video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {videos.map((item, idx) => (
          <VideoCard
            key={`${item.videoUrl || item.streamUrl}-${idx}`}
            item={item}
            onSelectVideo={handleSelectVideo}
          />
        ))}
      </div>

      {/* Tải thêm */}
      {searchMode === 'keyword' && videos.length > 0 && hasMore && (
        <div className="text-center my-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl border border-slate-800 transition inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 size={14} className="animate-spin text-blue-500" />
                Đang quét thêm video...
              </>
            ) : (
              <>
                <Plus size={14} />
                Tải thêm kết quả
              </>
            )}
          </button>
        </div>
      )}

      {/* Trạng thái trống */}
      {!loading && !hasSearched && (
        <div className="py-16 text-center text-slate-500 text-xs sm:text-sm px-4">
          {searchMode === 'keyword'
            ? 'Nhập từ khóa phía trên để bắt đầu tìm video.'
            : 'Dán link bài viết chứa video phía trên để bóc tách luồng phát trực tiếp.'}
        </div>
      )}

      {!loading && hasSearched && videos.length === 0 && (
        <div className="py-16 text-center text-slate-500 text-xs sm:text-sm">
          Không tìm thấy video nào từ nguồn yêu cầu.
        </div>
      )}

      {/* Modal Video Player: Khóa tràn viền và full view trên điện thoại */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-3xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 font-semibold uppercase shrink-0">
                  {selectedVideo.publisher || 'Web Video'}
                </span>
                <h3 className="text-xs font-medium truncate" title={selectedVideo.title}>
                  {selectedVideo.title}
                </h3>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openPopupWindow(selectedVideo.streamUrl || selectedVideo.videoUrl)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Mở tab riêng"
                >
                  <ExternalLink size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Đóng (ESC)"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Khung Chiếu Video */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {extracting ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                  <span className="text-xs font-medium">Đang trích xuất luồng video...</span>
                </div>
              ) : directStreamUrl ? (
                <video
                  key={directStreamUrl}
                  src={getSafeStreamUrl(directStreamUrl)}
                  controls
                  autoPlay
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain"
                >
                  Trình duyệt không hỗ trợ phát file này.
                </video>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-2 border border-blue-500/30">
                    <Play size={20} className="fill-current ml-0.5" />
                  </div>
                  <h4 className="text-white text-xs sm:text-sm font-semibold mb-1 line-clamp-2">
                    {selectedVideo.title}
                  </h4>
                  <p className="text-slate-400 text-xs mb-3">
                    Nguồn này bảo mật luồng video. Hãy mở trong tab riêng để xem.
                  </p>
                  <button
                    type="button"
                    onClick={() => openPopupWindow(selectedVideo.videoUrl)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5"
                  >
                    <Play size={13} className="fill-current" />
                    Mở tab xem video
                  </button>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="truncate max-w-[60%] font-mono text-[10px]">
                {selectedVideo.publisher || 'Web'} • {selectedVideo.views || 'Video'}
              </span>
              <button
                type="button"
                onClick={() => openPopupWindow(selectedVideo.streamUrl || selectedVideo.videoUrl)}
                className="text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
              >
                Mở link ngoài ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}