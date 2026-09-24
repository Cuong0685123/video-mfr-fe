import React, { useState } from 'react';
import { Play, ExternalLink, Film } from 'lucide-react';

export default function VideoCard({ item, onSelectVideo }) {
  const rawThumb = item?.thumbnailUrl || item?.thumbnail || item?.thumbnail_url || '';
  const [imgFailed, setImgFailed] = useState(!rawThumb);

  const getSafeThumbnail = (rawUrl) => {
    if (!rawUrl) return '';
    let target = rawUrl.trim();

    if (target.startsWith('data:image/')) {
      return target;
    }

    if (target.startsWith('//')) {
      target = 'https:' + target;
    }

    return `https://omnisearch-backend-fxr7.onrender.com/api/proxy-image?url=${encodeURIComponent(target)}`;
  };

  const thumbnailSrc = getSafeThumbnail(rawThumb);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-900/60 flex flex-col hover:border-slate-700 transition-all duration-200 group">
      {/* Khung Thumbnail Video: Tỉ lệ 16:9 */}
      <div
        className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer select-none flex items-center justify-center"
        onClick={() => onSelectVideo && onSelectVideo(item)}
      >
        {!imgFailed && thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={item.title || 'Video'}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 p-4 text-center">
            <Film size={26} className="text-slate-600 mb-1 opacity-70" />
            <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-800/80 max-w-[85%] truncate">
              {item.publisher || item.engine || 'Web Video'}
            </span>
          </div>
        )}

        {/* Nút Play trung tâm */}
        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg border border-white/60 transform group-hover:scale-110 transition-transform duration-200">
            <Play size={18} className="fill-white ml-0.5" />
          </div>
        </div>

        {/* Thời lượng video */}
        {item.duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-medium pointer-events-none">
            {item.duration}
          </span>
        )}

        {/* Tên nền tảng/Nguồn */}
        <span className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded capitalize truncate max-w-[120px] pointer-events-none">
          {item.publisher || item.engine}
        </span>
      </div>

      {/* Thông tin video */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-1.5">
        <h3
          className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 leading-snug cursor-pointer hover:text-blue-400 transition-colors"
          onClick={() => onSelectVideo && onSelectVideo(item)}
          title={item.title}
        >
          {item.title}
        </h3>

        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-1">
          <span className="truncate max-w-[130px]">
            {item.views || item.publisher || 'Web Video'}
          </span>

          <a
            href={item.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Mở link ngoài"
            className="p-1 text-slate-400 hover:text-blue-400 transition-colors shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}