/** * Video Tutorials Component * * Displays video tutorials and demos. * * @component */ 'use client';
import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import { Play, ExternalLink, Video as VideoIcon } from 'lucide-react';
export interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  videoUrl: string;
  duration?: string;
  category: string;
  external?: boolean;
}
export interface VideoTutorialsProps {
  videos?: VideoTutorial[];
  className?: string;
}
const defaultVideos: VideoTutorial[] = [
  {
    id: '1',
    title: 'Getting Started Tutorial',
    description: 'Learn the basics of using the platform',
    videoUrl: 'https://www.youtube.com/watch?v=example',
    duration: '5:30',
    category: 'Getting Started',
    external: true,
  },
  {
    id: '2',
    title: 'Advanced Features',
    description: 'Explore advanced features and customization',
    videoUrl: 'https://www.youtube.com/watch?v=example2',
    duration: '12:45',
    category: 'Advanced',
    external: true,
  },
  {
    id: '3',
    title: 'API Integration',
    description: 'How to integrate with our API',
    videoUrl: 'https://www.youtube.com/watch?v=example3',
    duration: '8:20',
    category: 'API',
    external: true,
  },
];
/** * Video Tutorials Component * * Displays video tutorials in a grid layout. */ export default function VideoTutorials({
  videos = defaultVideos,
  className,
}: VideoTutorialsProps) {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const categories = Array.from(new Set(videos.map((video) => video.category)));
  const handleVideoClick = (video: VideoTutorial) => {
    if (video.external) {
      window.open(video.videoUrl, '_blank', 'noopener,noreferrer');
    } else {
      setSelectedVideo(video);
    }
  };
  return (
    <div className={className}>
      {' '}
      {categories.map((category) => {
        const categoryVideos = videos.filter((video) => video.category === category);
        return (
          <Card key={category} title={category} className="mb-6">
            {' '}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {' '}
              {categoryVideos.map((video) => (
                <div
                  key={video.id}
                  className="border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {' '}
                  <div className="relative aspect-video bg-muted">
                    {' '}
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {' '}
                        <VideoIcon className="w-12 h-12 text-muted-foreground" />{' '}
                      </div>
                    )}{' '}
                    <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 hover:bg-foreground/40 transition-colors">
                      {' '}
                      <Button
                        onClick={() => handleVideoClick(video)}
                        variant="primary"
                        className="rounded-full p-4"
                      >
                        {' '}
                        <Play className="w-6 h-6" />{' '}
                      </Button>{' '}
                    </div>{' '}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-xs px-2 py-1 rounded">
                        {' '}
                        {video.duration}{' '}
                      </div>
                    )}{' '}
                  </div>{' '}
                  <div className="p-4">
                    {' '}
                    <h3 className="font-medium text-foreground mb-1"> {video.title} </h3>{' '}
                    <p className="text-sm text-muted-foreground mb-2"> {video.description} </p>{' '}
                    {video.external && (
                      <div className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                        {' '}
                        <ExternalLink className="w-3 h-3" /> <span>Watch on YouTube</span>{' '}
                      </div>
                    )}{' '}
                  </div>{' '}
                </div>
              ))}{' '}
            </div>{' '}
          </Card>
        );
      })}{' '}
      {/* Video Modal (for embedded videos) */}{' '}
      {selectedVideo && !selectedVideo.external && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
          {' '}
          <div className="bg-background rounded-lg max-w-4xl w-full p-4">
            {' '}
            <div className="flex justify-between items-center mb-4">
              {' '}
              <h3 className="text-lg font-semibold text-foreground">
                {' '}
                {selectedVideo.title}{' '}
              </h3>{' '}
              <Button onClick={() => setSelectedVideo(null)} variant="ghost" size="sm">
                {' '}
                ×{' '}
              </Button>{' '}
            </div>{' '}
            <div className="aspect-video">
              {' '}
              <iframe
                src={selectedVideo.videoUrl}
                className="w-full h-full rounded"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />{' '}
            </div>{' '}
          </div>{' '}
        </div>
      )}{' '}
    </div>
  );
}
