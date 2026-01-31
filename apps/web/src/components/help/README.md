# Help Components

Help center and support components for user assistance.

## 📦 Components

- **HelpCenter** - Main help center hub
- **FAQ** - Frequently asked questions display
- **ContactSupport** - Contact support form
- **SupportTickets** - View and manage support tickets
- **TicketDetails** - View individual ticket details
- **UserGuides** - User guides and documentation
- **VideoTutorials** - Video tutorial library

## 📖 Usage Examples

### Help Center

```tsx
import { HelpCenter } from '@/components/help';

<HelpCenter categories={helpCategories} />;
```

### FAQ

```tsx
import { FAQ } from '@/components/help';

<FAQ faqs={faqItems} />;
```

### Contact Support

```tsx
import { ContactSupport } from '@/components/help';

<ContactSupport onSubmit={async (data) => await submitSupportRequest(data)} />;
```

### Support Tickets

```tsx
import { SupportTickets } from '@/components/help';

<SupportTickets tickets={ticketsList} onCreateTicket={() => handleCreateTicket()} />;
```

## 🎨 Features

- **Help Categories**: Organize help content by category
- **Search**: Search help articles and FAQs
- **Ticket System**: Create and track support tickets
- **Video Tutorials**: Embedded video tutorials
- **User Guides**: Step-by-step guides
- **Live Chat**: Integration with live chat (if available)

## 🔧 Configuration

### HelpCenter

- `categories`: Array of help categories
- `className`: Additional CSS classes

### FAQ

- `faqs`: Array of FAQ items
- `className`: Additional CSS classes

### ContactSupport

- `onSubmit`: Submit callback
- `className`: Additional CSS classes

### SupportTickets

- `tickets`: Array of ticket objects
- `onCreateTicket`: Create ticket callback

## 🔗 Related Components

- See `/components/documentation` for documentation components
- See `/components/ui` for base UI components
