import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getNotices } from '../lib/api';
import type { Notice } from '../lib/types';

export default function NoticeBoard() {
  const { data: notices } = useQuery({
    queryKey: ['notices'],
    queryFn: getNotices,
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="text-primary" />
        <h2 className="text-2xl font-bold">Notice Board</h2>
      </div>

      <div className="space-y-4">
        {notices?.slice(0, 2).map((notice: Notice) => (
          <div key={notice.id} className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold">{notice.title}</h3>
              <span className="text-sm text-gray-500">
                {new Date(notice.created_at).toLocaleDateString()}
              </span>
            </div>

            {notice.type === 'text' && (
              <p className="text-gray-600">{notice.content}</p>
            )}

            {notice.type === 'image' && (
              <img
                src={notice.content}
                alt={notice.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            )}

            {notice.type === 'video' && (
              <div className="aspect-video">
                <iframe
                  src={notice.content}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {notice.type === 'link' && (
              <a
                href={notice.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Resource
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
