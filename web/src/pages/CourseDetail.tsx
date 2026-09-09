import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router';
import { api } from '../api';
import { useAuth } from '../auth';
import { ArrowLeft, Clock, Users, Award, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cover_url: string;
  video_url: string;
  duration: number;
  difficulty: string;
  instructor: string;
  is_featured: boolean;
}

const DIFFICULTY_MAP: Record<string, string> = {
  beginner: '入门级',
  intermediate: '进阶级',
  advanced: '高阶级',
};

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    api.courses.get(id)
      .then((c) => { setCourse(c); document.title = `${c.title} · 课程详情`; })
      .catch(() => toast.error('课程加载失败'));
    api.courses.progress(id)
      .then((p) => {
        setProgress(p.progress || 0);
        lastSavedRef.current = p.progress || 0;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const saveProgress = useCallback(async (pct: number) => {
    if (!course || !isLoggedIn) return;
    try {
      await api.courses.updateProgress(course.id, pct);
      lastSavedRef.current = pct;
    } catch {
      // 忽略保存失败，避免打断学习
    }
  }, [course, isLoggedIn]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !course || !v.duration) return;
    const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
    setProgress(pct);
    if (isLoggedIn && pct - lastSavedRef.current >= 5) {
      saveProgress(pct);
    }
  };

  const handleComplete = async () => {
    if (!course) return;
    setProgress(100);
    if (!isLoggedIn) {
      toast.info('登录后可保存学习进度并获取证书');
      return;
    }
    try {
      await saveProgress(100);
      toast.success('课程学习完成，证书可在个人中心查看');
    } catch (e: any) {
      toast.error(e.message || '进度保存失败');
    }
  };

  if (loading) {
    return <div className="text-center py-40 text-[#F0EDE0] opacity-50">加载中...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-40 text-[#F0EDE0]">
        <p className="opacity-50 mb-4">课程不存在或已下架</p>
        <Link to="/study-tour" className="text-sm" style={{ color: '#E84A3A' }}>返回研学课程</Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#0B0E14', minHeight: '100vh', paddingTop: '80px' }}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <Link to="/study-tour" className="inline-flex items-center gap-1 text-xs mb-6 opacity-50 hover:opacity-80" style={{ color: '#F0EDE0' }}>
          <ArrowLeft size={14} /> 返回研学课程
        </Link>

        <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(240,237,224,0.08)' }}>
          <div className="aspect-video bg-black relative">
            <video
              ref={videoRef}
              src={course.video_url}
              poster={course.cover_url}
              controls
              className="w-full h-full"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleComplete}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(36,65,169,0.15)', color: '#F0EDE0' }}>
                {DIFFICULTY_MAP[course.difficulty] || course.difficulty}
              </span>
              {course.is_featured && (
                <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(232,74,58,0.15)', color: '#E84A3A' }}>
                  精选课程
                </span>
              )}
            </div>

            <h1 className="font-bold text-[#F0EDE0] mb-2" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
              {course.title}
            </h1>
            <p className="text-[#F0EDE0] opacity-60 mb-6">{course.subtitle}</p>

            <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}>
              <h3 className="text-sm font-bold text-[#F0EDE0] mb-3">课程介绍</h3>
              <p className="text-sm opacity-70 leading-relaxed" style={{ color: '#F0EDE0' }}>{course.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}>
              <h3 className="text-sm font-bold text-[#F0EDE0] mb-4">课程信息</h3>
              <div className="space-y-3 text-sm" style={{ color: '#F0EDE0' }}>
                <div className="flex items-center gap-2 opacity-70">
                  <Clock size={16} style={{ color: '#E84A3A' }} /> 时长 {course.duration} 分钟
                </div>
                <div className="flex items-center gap-2 opacity-70">
                  <Users size={16} style={{ color: '#E84A3A' }} /> 讲师 {course.instructor}
                </div>
                <div className="flex items-center gap-2 opacity-70">
                  <Play size={16} style={{ color: '#E84A3A' }} /> 在线视频
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(240,237,224,0.03)', border: '1px solid rgba(240,237,224,0.08)' }}>
              <h3 className="text-sm font-bold text-[#F0EDE0] mb-3 flex items-center gap-2">
                <Award size={16} style={{ color: '#E84A3A' }} /> 学习进度
              </h3>
              <div className="h-2 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: 'rgba(240,237,224,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: '#E84A3A' }} />
              </div>
              <p className="text-xs opacity-50" style={{ color: '#F0EDE0' }}>{progress}% 已完成</p>
              {progress >= 100 && (
                <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: '#34D399' }}>
                  <CheckCircle size={14} /> 已完成学习
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
