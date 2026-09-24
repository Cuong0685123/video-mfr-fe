import React, { useState } from 'react';
import { Play, ExternalLink, Film } from 'lucide-react';

export default function VideoCard({ item, onSelectVideo }) {
  const rawThumb = item?.thumbnailUrl || item?.thumbnail || item?.thumbnail_url || '';
  const [imgFailed, setImgFailed] = useState(!rawThumb);

  // Xử lý link thumbnail qua Proxy của Backend
  const getSafeThumbnail = (rawUrl) => {
    if (!rawUrl) return '';
    let target = rawUrl.trim();

    // 1. Nếu là ảnh base64 (data:image/...) thì dùng trực tiếp, KHÔNG đi qua proxy
    if (target.startsWith('data:image/')) {
      return target;
    }

    // 2. Nếu link bắt đầu bằng // (VD: //bing.com/...)
    if (target.startsWith('//')) {
      target = 'https:' + target;
    }

    // 3. Chỉ đưa qua Backend Proxy đối với các đường link http/https ngoài
    return `http://localhost:5000/api/proxy-image?url=${encodeURIComponent(target)}`;
  };

  // Khai báo biến thumbnailSrc bằng cách gọi hàm xử lý an toàn
  const thumbnailSrc = getSafeThumbnail(rawThumb);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white flex flex-col shadow-sm hover:shadow-lg transition-all duration-300 group">
      {/* Khung Thumbnail Video: Ép cứng tỉ lệ 16:9 và nền tối */}
      <div
        className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer select-none flex items-center justify-center"
        onClick={() => onSelectVideo && onSelectVideo(item)}
      >
        {/* Hình ảnh Thumbnail */}
        {!imgFailed && thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={item.title || 'Video'}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          // Khung nền khi ảnh lỗi: Giữ màu tối phim ảnh, không bị trắng bệch
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-400 p-4 text-center">
            <Film size={28} className="text-slate-600 mb-2 opacity-60" />
            <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/80 max-w-[80%] truncate">
              {item.publisher || item.engine || 'Web Video'}
            </span>
          </div>
        )}

        {/* NÚT PLAY TRUNG TÂM */}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-xl border-2 border-white/80 transform group-hover:scale-110 transition-transform duration-200">
            <Play size={22} className="fill-white ml-0.5" />
          </div>
        </div>

        {/* Thời lượng video (nằm góc dưới phải) */}
        {item.duration && (
          <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm text-white text-[11px] font-mono px-1.5 py-0.5 rounded font-medium pointer-events-none shadow">
            {item.duration}
          </span>
        )}

        {/* Tên nền tảng/Nguồn (nằm góc trên trái) */}
        <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded capitalize truncate max-w-[130px] pointer-events-none shadow">
          {item.publisher || item.engine}
        </span>
      </div>

      {/* Phần thông tin tiêu đề và views */}
      <div className="p-3 flex-1 flex flex-col justify-between gap-2">
        <h3
          className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => onSelectVideo && onSelectVideo(item)}
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span className="truncate max-w-[140px] font-medium">
            {item.views || item.publisher || 'Web Video'}
          </span>

          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở link ngoài"
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}