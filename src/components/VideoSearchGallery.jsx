import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Link as LinkIcon, Loader2, Plus, Globe, Layers, X, ExternalLink, Play, Film } from 'lucide-react';
import VideoCard from './VideoCard';

export default function VideoSearchGallery() {
  // Tab chế độ: 'keyword' (Tìm theo từ khóa) | 'link' (Bóc video từ Link Web)
  const [searchMode, setSearchMode] = useState('keyword');

  // State cho Chế độ Từ khóa
  const [query, setQuery] = useState('');
  const [engine, setEngine] = useState('bing');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // State cho Chế độ Bóc link web
  const [linkInput, setLinkInput] = useState('');

  // State chung
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal Player
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

  // Hàm chuyển đổi URL sang Proxy Backend nếu gặp domain chặn Hotlink (Twitter/X)
  const getSafeStreamUrl = (url = '') => {
    if (!url) return '';
    if (url.includes('twimg.com') || url.includes('twitter.com') || url.includes('x.com')) {
      return `http://localhost:5000/api/proxy-video?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // 1. Tìm kiếm theo từ khóa
  const handleKeywordSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setPage(1);
    setHasMore(true);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/videos?q=${encodeURIComponent(query)}&page=1&engine=${engine}`
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

  // 2. Bóc video từ link web
  const handleExtractFromLink = async (e) => {
    e?.preventDefault();
    if (!linkInput.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setHasMore(false);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/extract-from-web?url=${encodeURIComponent(linkInput.trim())}`
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
        .get(`http://localhost:5000/api/videos?q=${encodeURIComponent(query)}&page=1&engine=${newEngine}`)
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
        `http://localhost:5000/api/videos?q=${encodeURIComponent(query)}&page=${nextPage}&engine=${engine}`
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

    // Nếu bản thân item đã có streamUrl bóc sẵn
    if (video.streamUrl) {
      setDirectStreamUrl(video.streamUrl);
      return;
    }

    if (isDirectVideoStream(video.videoUrl)) {
      setDirectStreamUrl(video.videoUrl);
      return;
    }

    // Bóc tách direct link qua API
    setExtracting(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/extract-video?url=${encodeURIComponent(video.videoUrl)}`
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
    <div className="w-full flex-1 flex flex-col relative items-center">
      {/* 2 NÚT CHUYỂN CHẾ ĐỘ: TÌM TỪ KHÓA & BÓC TỪ LINK */}
      <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-md mb-4 w-full max-w-xl">
        <button
          type="button"
          onClick={() => {
            setSearchMode('keyword');
            setVideos([]);
            setHasSearched(false);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            searchMode === 'keyword'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search size={15} />
          Tìm theo từ khóa
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('link');
            setVideos([]);
            setHasSearched(false);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            searchMode === 'link'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LinkIcon size={15} className="text-blue-600" />
          Bóc video từ Link Web
        </button>
      </div>

      {/* KHUNG INPUT THỰC THI */}
      <div className="max-w-xl w-full mb-6">
        {searchMode === 'keyword' ? (
          /* Chế độ 1: Tìm theo từ khóa */
          <div>
            <form onSubmit={handleKeywordSearch} className="flex gap-2">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Tìm'}
              </button>
            </form>

            <div className="flex justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleEngineChange('bing')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  engine === 'bing'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Globe size={13} />
                Nguồn 1 (Bing Web)
              </button>
              <button
                type="button"
                onClick={() => handleEngineChange('yandex')}
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  engine === 'yandex'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                <Layers size={13} />
                Nguồn 2 (DuckDuckGo Web)
              </button>
            </div>
          </div>
        ) : (
          /* Chế độ 2: Bóc video từ Link Web */
          <form onSubmit={handleExtractFromLink} className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="url"
                required
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Dán link website vào đây (VD: https://x.com/.../status/...)..."
                style={{
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                  WebkitTextFillColor: '#0f172a',
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Bóc video'}
            </button>
          </form>
        )}
      </div>

      {/* Thông tin số lượng */}
      {videos.length > 0 && (
        <div className="w-full flex justify-between items-center text-xs text-slate-400 pb-3 border-b border-slate-800/80 mb-4">
          <span>Tìm thấy: <strong className="text-white">{videos.length}</strong> video</span>
          <span>{searchMode === 'keyword' ? `Nguồn: ${engine.toUpperCase()}` : 'Chế độ bóc tách link'}</span>
        </div>
      )}

      {/* Lưới danh sách Video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
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
        <div className="text-center my-8">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl border border-slate-800 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
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
        <div className="py-24 text-center text-slate-400 text-sm">
          {searchMode === 'keyword'
            ? 'Nhập từ khóa phía trên để bắt đầu tìm video.'
            : 'Dán link bài viết chứa video phía trên để bóc tách luồng phát trực tiếp.'}
        </div>
      )}

      {!loading && hasSearched && videos.length === 0 && (
        <div className="py-24 text-center text-slate-400 text-sm">
          Không tìm thấy video nào từ nguồn yêu cầu.
        </div>
      )}

      {/* MODAL PHÁT VIDEO ĐƯỢC BÓC TÁCH */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2 truncate pr-4">
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-600/30 text-blue-400 font-semibold uppercase">
                  {selectedVideo.publisher || 'Web Video'}
                </span>
                <h3 className="text-xs sm:text-sm font-medium truncate" title={selectedVideo.title}>
                  {selectedVideo.title}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openPopupWindow(selectedVideo.streamUrl || selectedVideo.videoUrl)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Mở tab riêng"
                >
                  <ExternalLink size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Đóng (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Khung Chiếu Video: Có referrerPolicy="no-referrer" và hỗ trợ Proxy */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {extracting ? (
                <div className="flex flex-col items-center gap-3 text-slate-300">
                  <Loader2 size={36} className="animate-spin text-emerald-500" />
                  <span className="text-xs font-medium tracking-wide">Đang trích xuất luồng video...</span>
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
                <div className="flex flex-col items-center justify-center p-6 text-center max-w-md">
                  <div className="w-14 h-14 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center mb-3 border border-blue-500/30">
                    <Play size={24} className="fill-current ml-1" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1 line-clamp-2">
                    {selectedVideo.title}
                  </h4>
                  <p className="text-slate-400 text-xs mb-4">
                    Trang nguồn này chặn nhúng hoặc bảo mật luồng video. Hãy mở trong cửa sổ rạp chiếu riêng để xem.
                  </p>
                  <button
                    type="button"
                    onClick={() => openPopupWindow(selectedVideo.videoUrl)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
                  >
                    <Play size={14} className="fill-current" />
                    Mở Rạp Chiếu Riêng
                  </button>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span className="truncate max-w-[60%] font-mono text-[11px]">
                {selectedVideo.publisher || 'Web'} • {selectedVideo.views || 'Video'}
              </span>
              <button
                type="button"
                onClick={() => openPopupWindow(selectedVideo.streamUrl || selectedVideo.videoUrl)}
                className="text-blue-400 hover:underline flex items-center gap-1 text-xs"
              >
                Mở trong rạp chiếu riêng ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}