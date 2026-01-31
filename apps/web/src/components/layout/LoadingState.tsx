import { Loading } from '@/components/ui';
interface LoadingStateProps {
  text?: string;
  fullScreen?: boolean;
}
export default function LoadingState({
  text = 'Chargement...',
  fullScreen = false,
}: LoadingStateProps) {
  return <Loading size="lg" text={text} fullScreen={fullScreen} />;
}
