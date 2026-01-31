# Surveys Components

Components for creating, taking, and analyzing surveys.

## 📦 Components

- **SurveyBuilder** - Build surveys with drag-and-drop
- **SurveyTaker** - Take/complete surveys
- **SurveyResults** - View survey results and analytics

## 📖 Usage Examples

### Survey Builder

```tsx
import { SurveyBuilder } from '@/components/surveys';
import type { Survey } from '@/components/surveys';

<SurveyBuilder
  survey={surveyData}
  onSave={async (survey) => await saveSurvey(survey)}
  onPublish={async (survey) => await publishSurvey(survey)}
/>;
```

### Survey Taker

```tsx
import { SurveyTaker } from '@/components/surveys';

<SurveyTaker survey={surveyData} onSubmit={async (data) => await submitSurvey(data)} />;
```

### Survey Results

```tsx
import { SurveyResults } from '@/components/surveys';

<SurveyResults
  survey={surveyData}
  submissions={submissionsList}
  onExport={async (format) => await exportResults(format)}
/>;
```

## 🎨 Features

- **Question Types**: Text, email, textarea, select, checkbox, radio, number, date, scale, matrix, ranking, NPS, rating, yes/no
- **Conditional Logic**: Skip questions based on answers
- **Multi-Page**: Support for multiple pages
- **Progress Bar**: Show completion progress
- **Results Analytics**: Charts and statistics
- **Export**: Export results to CSV, Excel, JSON
- **Public Links**: Share surveys via public links

## 🔧 Configuration

### SurveyBuilder

- `survey`: Survey object
- `onSave`: Save callback
- `onPublish`: Publish callback
- `onPreview`: Preview callback

### SurveyTaker

- `survey`: Survey object to take
- `onSubmit`: Submission callback

### SurveyResults

- `survey`: Survey object
- `submissions`: Array of submission objects
- `onExport`: Export callback

## 🔗 Related Components

- See `/components/cms` for CMSFormBuilder
- See `/components/ui` for base UI components
