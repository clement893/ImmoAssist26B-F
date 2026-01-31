import { Card } from '@/components/ui';
interface FAQItemProps {
  question: string;
  answer: string;
}
export default function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <Card>
      {' '}
      <div className="p-6">
        {' '}
        <h3 className="text-lg font-semibold text-foreground mb-2"> {question} </h3>{' '}
        <p className="text-muted-foreground">{answer}</p>{' '}
      </div>{' '}
    </Card>
  );
}
